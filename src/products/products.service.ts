import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }


  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product
    } catch (error) {
      this.handledError(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const result = await this.productRepository.find({
      take: limit,
      skip: offset,
      order: {
        title: 'ASC',
      },
    });
    return result;
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
        .getOne();
    }
    if (!product) {
      throw new NotFoundException(`Product with term ${term} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto
  ) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    try {
      await this.productRepository.save(product);
    } catch (error) {
      this.handledError(error);
    }
    return product;
  }

  async remove(id: string) {
    const productExists = await this.findOne(id);
    await this.productRepository.remove(productExists);
    return `This action removes a #${productExists.slug} product`;
  }

  private handledError(error: any) {
    if (error.code === '23505') { // Unique constraint violation
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('check server logs');
  }
}
