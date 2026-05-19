import ProductsCarousel from "./ProductsCarousel";

export default function PrintingCarousel() {
  return (
    <ProductsCarousel
      type="printing"
      title="Printing Services"
      limit={10}
      viewAllLink="/printing"
    />
  );
}
