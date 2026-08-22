import ProductDetail from '../../../../components/ProductDetail';
import { getProduct, getRelated } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  return { title: product ? product.name : 'Product not found' };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(Number(id));

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Product not found</h3>
          <p>This foodstuff is no longer available.</p>
          <a className="btn btn-primary" href="/shop">Go to shop</a>
        </div>
      </div>
    );
  }

  const related = await getRelated(product);

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span className="sep">›</span>
        <a href="/shop">Shop</a><span className="sep">›</span>
        <a href={`/shop?category=${product.category_slug}`}>{product.category_name}</a><span className="sep">›</span>
        <span>{product.name}</span>
      </nav>
      <ProductDetail product={product} related={related} />
    </div>
  );
}
