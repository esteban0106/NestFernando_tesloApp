import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);
  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource

  ) { }


  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productData } = createProductDto;
      const product = this.productRepository.create({
        ...productData,
        images: images.map(image => this.productImageRepository.create({ url: image })),
      });
      await this.productRepository.save(product);
      return {
        ...product,
        images
      }
    } catch (error) {
      this.handledError(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
      order: {
        title: 'ASC',
      },
    });
    return products.map(product => ({
      ...product,
      images: product.images?.map(image => image.url)
    }));
  }

  async findOne(term: string) {
    let product: Product | null;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where('UPPER(title) =:title or LOWER(slug) =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('Product.images', 'images')
        .getOne();
    }
    if (!product) {
      throw new NotFoundException(`Product with term ${term} not found`);
    }
    return product
  }

  async findOnePlane(term: string) {
    const product = await this.findOne(term);
    return {
      ...product,
      images: product.images?.map(image => image.url)
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto
  ) {

    const { images, ...updateData } = updateProductDto;
    const product = await this.productRepository.preload({ id, ...updateData });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (images) {
        // Remove old images
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        // Add new images
        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      }
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlane(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handledError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    // Fetch the actual Product entity
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.productRepository.remove(product);
    return `This action removes a #${product.slug} product`;
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handledError(error);
    }
  }

  private handledError(error: any) {
    if (error.code === '23505') { // Unique constraint violation
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('check server logs');
  }
}
