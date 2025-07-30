import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data-init';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ) { }


  async runSeed() {
    await this.insertNewProducts()
    return true;
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();

    // const products = initialData.products;
    const products = initialData.products.filter((p) => p !== undefined);

    await Promise.all(
      products.map(product => this.productsService.create(product))
    );

    return true
  }

}
