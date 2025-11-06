import { db } from './db';
import { users, categories, products } from '@shared/schema';
import { hashPassword } from './auth';

async function seed() {
  console.log('🌱 Seeding database...');

  const existingUsers = await db.select().from(users);
  let admin, customer;

  if (existingUsers.length === 0) {
    const adminPassword = await hashPassword('admin123');
    const customerPassword = await hashPassword('customer123');

    [admin, customer] = await db.insert(users).values([
      {
        name: 'Admin User',
        email: 'admin@fashion.com',
        passwordHash: adminPassword,
        role: 'ADMIN'
      },
      {
        name: 'John Customer',
        email: 'customer@example.com',
        passwordHash: customerPassword,
        role: 'CUSTOMER'
      }
    ]).returning();

    console.log('✅ Created users');
  } else {
    console.log('✅ Users already exist, skipping user creation');
    admin = existingUsers.find(u => u.email === 'admin@fashion.com');
    customer = existingUsers.find(u => u.email === 'customer@example.com');
  }

  console.log('🌐 Fetching products from DummyJSON API...');

  const response = await fetch('https://dummyjson.com/products?limit=100');
  const data = await response.json();
  const apiProducts = data.products;

  console.log(`✅ Fetched ${apiProducts.length} products from API`);

  const categoryMapping: Record<string, any> = {};
  const categoryImages: Record<string, string> = {
    'women': '',
    'men': '',
    'accessories': '',
    'shoes': ''
  };

  for (const product of apiProducts) {
    const category = product.category.toLowerCase();
    
    if (category.includes('women') || category.includes('beauty') || category.includes('fragrances')) {
      if (!categoryImages.women) categoryImages.women = product.thumbnail;
    } else if (category.includes('men')) {
      if (!categoryImages.men) categoryImages.men = product.thumbnail;
    } else if (category.includes('accessories') || category.includes('sunglasses') || category.includes('jewellery')) {
      if (!categoryImages.accessories) categoryImages.accessories = product.thumbnail;
    }
  }

  categoryImages.shoes = apiProducts.find((p: any) => 
    p.category.toLowerCase().includes('shoe') || 
    p.category.toLowerCase().includes('sneaker')
  )?.thumbnail || apiProducts[0].thumbnail;

  const existingCategories = await db.select().from(categories);
  let womenCat, menCat, accessoriesCat, shoesCat;

  if (existingCategories.length === 0) {
    [womenCat, menCat, accessoriesCat, shoesCat] = await db.insert(categories).values([
    { 
      name: 'Women', 
      slug: 'women', 
      image: categoryImages.women || 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png'
    },
    { 
      name: 'Men', 
      slug: 'men', 
      image: categoryImages.men || 'https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Short%20Sleeve%20Shirt/thumbnail.png'
    },
    { 
      name: 'Accessories', 
      slug: 'accessories', 
      image: categoryImages.accessories || 'https://cdn.dummyjson.com/products/images/sunglasses/Classic%20Sun%20Glasses/thumbnail.png'
    },
    { 
      name: 'Shoes', 
      slug: 'shoes', 
      image: categoryImages.shoes || 'https://cdn.dummyjson.com/products/images/mens-shoes/Nike%20Air%20Jordan%201%20Red%20And%20Black/thumbnail.png'
    },
    ]).returning();

    console.log('✅ Created categories');
  } else {
    console.log('✅ Categories already exist, skipping category creation');
    womenCat = existingCategories.find(c => c.slug === 'women')!;
    menCat = existingCategories.find(c => c.slug === 'men')!;
    accessoriesCat = existingCategories.find(c => c.slug === 'accessories')!;
    shoesCat = existingCategories.find(c => c.slug === 'shoes')!;
  }

  categoryMapping['women'] = womenCat.id;
  categoryMapping['men'] = menCat.id;
  categoryMapping['accessories'] = accessoriesCat.id;
  categoryMapping['shoes'] = shoesCat.id;

  const productsToInsert = apiProducts.map((product: any, index: number) => {
    const category = product.category.toLowerCase();
    let categoryId = womenCat.id;
    let sizes: string[] = [];
    let badge: string | undefined;

    if (category.includes('women') || category.includes('beauty') || category.includes('fragrances') || category.includes('tops')) {
      categoryId = womenCat.id;
      sizes = ['XS', 'S', 'M', 'L', 'XL'];
    } else if (category.includes('men') || category.includes('shirt') || category.includes('watch')) {
      categoryId = menCat.id;
      sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    } else if (category.includes('accessories') || category.includes('sunglasses') || category.includes('jewellery') || category.includes('bags')) {
      categoryId = accessoriesCat.id;
      sizes = [];
    } else if (category.includes('shoe') || category.includes('sneaker')) {
      categoryId = shoesCat.id;
      sizes = ['7', '8', '9', '10', '11', '12'];
    } else {
      categoryId = womenCat.id;
      sizes = ['S', 'M', 'L', 'XL'];
    }

    if (product.rating >= 4.5) {
      badge = 'Bestseller';
    } else if (product.discountPercentage > 15) {
      badge = 'Sale';
    } else if (index < 10) {
      badge = 'New Arrival';
    }

    const baseSlug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${product.id}`;

    return {
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      categoryId,
      images: product.images || [product.thumbnail],
      sizes: sizes.length > 0 ? sizes : undefined,
      badge,
      slug: uniqueSlug
    };
  });

  await db.insert(products).values(productsToInsert);

  console.log('✅ Created products');
  console.log('\n🎉 Seed completed successfully!');
  console.log(`📦 Inserted ${productsToInsert.length} products from DummyJSON API`);
  console.log('\nTest accounts:');
  console.log('Admin: admin@fashion.com / admin123');
  console.log('Customer: customer@example.com / customer123');
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
