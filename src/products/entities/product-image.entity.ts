import { IsInt } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";


@Entity()
export class ProductImage {

  @PrimaryGeneratedColumn('increment')
  @IsInt()
  id: number;

  @Column('text', {
    unique: true,
  })
  url: string;

  @ManyToOne(
    () => Product,
    (product) => product.images,
    { onDelete: 'CASCADE' }
  )
  product: Product
}
