import { db } from './db';
import { users, categories, products } from '@shared/schema';
import { hashPassword } from './auth';

async function seed() {
  console.log('🌱 Seeding database...');

  const adminPassword = await hashPassword('admin123');
  const customerPassword = await hashPassword('customer123');

  const [admin, customer] = await db.insert(users).values([
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

  const [womenCat, menCat, accessoriesCat, shoesCat] = await db.insert(categories).values([
    { name: 'Women', slug: 'women', image: '/attached_assets/generated_images/Navy_dress_editorial_photo_d568c8d5.png' },
    { name: 'Men', slug: 'men', image: '/attached_assets/generated_images/Beige_trench_coat_menswear_7ec0bf00.png' },
    { name: 'Accessories', slug: 'accessories', image: '/attached_assets/generated_images/Brown_leather_handbag_product_1e816cbe.png' },
    { name: 'Shoes', slug: 'shoes', image: '/attached_assets/generated_images/White_sneakers_product_photo_3cec6868.png' },
  ]).returning();

  console.log('✅ Created categories');

  await db.insert(products).values([
    {
      title: 'Elegant Evening Dress',
      description: 'A timeless evening dress crafted from premium fabric. Perfect for special occasions.',
      price: '129.99',
      stock: 50,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Navy_dress_editorial_photo_d568c8d5.png', '/attached_assets/generated_images/Black_dress_editorial_shot_08cd464c.png'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      badge: 'New Arrival',
      slug: 'elegant-evening-dress'
    },
    {
      title: 'Classic Trench Coat',
      description: 'Sophisticated trench coat with modern tailoring. Water-resistant fabric.',
      price: '249.99',
      stock: 30,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Beige_trench_coat_menswear_7ec0bf00.png'],
      sizes: ['S', 'M', 'L', 'XL'],
      slug: 'classic-trench-coat'
    },
    {
      title: 'Premium White Sneakers',
      description: 'Minimalist leather sneakers for everyday wear. Comfortable and stylish.',
      price: '89.99',
      stock: 100,
      categoryId: shoesCat.id,
      images: ['/attached_assets/generated_images/White_sneakers_product_photo_3cec6868.png'],
      sizes: ['7', '8', '9', '10', '11', '12'],
      badge: 'Sale',
      slug: 'premium-white-sneakers'
    },
    {
      title: 'Silk Blouse',
      description: 'Luxurious silk blouse with elegant draping. Perfect for office or evening wear.',
      price: '79.99',
      stock: 45,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Cream_silk_blouse_editorial_57c2ee7e.png'],
      sizes: ['XS', 'S', 'M', 'L'],
      slug: 'silk-blouse'
    },
    {
      title: 'Leather Handbag',
      description: 'Premium leather handbag with gold hardware. Spacious interior with multiple compartments.',
      price: '199.99',
      stock: 25,
      categoryId: accessoriesCat.id,
      images: ['/attached_assets/generated_images/Brown_leather_handbag_product_1e816cbe.png'],
      slug: 'leather-handbag'
    },
    {
      title: 'Tailored Blazer',
      description: 'Perfectly tailored blazer for a sharp, professional look.',
      price: '189.99',
      stock: 35,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Gray_blazer_fashion_editorial_cbbb5aba.png'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      slug: 'tailored-blazer'
    },
    {
      title: 'Essential White Tee',
      description: 'Premium cotton t-shirt. A wardrobe essential.',
      price: '29.99',
      stock: 200,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/White_t-shirt_product_photo_1fbe4f1d.png'],
      sizes: ['S', 'M', 'L', 'XL'],
      slug: 'essential-white-tee'
    },
    {
      title: 'Cozy Cardigan',
      description: 'Soft, comfortable cardigan perfect for layering.',
      price: '99.99',
      stock: 60,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Olive_cardigan_fashion_shot_d66f42be.png'],
      sizes: ['S', 'M', 'L'],
      badge: 'New Arrival',
      slug: 'cozy-cardigan'
    },
    {
      title: 'Classic Blue Denim Jeans',
      description: 'Premium quality blue denim jeans with a slim fit. Made from comfortable stretch denim.',
      price: '69.99',
      stock: 80,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Blue_denim_jeans_product_d37c0ce8.png'],
      sizes: ['24', '26', '28', '30', '32'],
      slug: 'classic-blue-denim-jeans'
    },
    {
      title: 'Cashmere Knit Sweater',
      description: 'Luxurious cashmere sweater in a beautiful beige tone. Perfect for chilly days.',
      price: '159.99',
      stock: 40,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Beige_knit_sweater_product_3cc31cf6.png'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      badge: 'Bestseller',
      slug: 'cashmere-knit-sweater'
    },
    {
      title: 'Floral Summer Dress',
      description: 'Flowing midi dress with vibrant floral print. Perfect for warm weather occasions.',
      price: '89.99',
      stock: 55,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Floral_summer_dress_product_c2d08210.png'],
      sizes: ['XS', 'S', 'M', 'L'],
      slug: 'floral-summer-dress'
    },
    {
      title: 'Leather Moto Jacket',
      description: 'Edgy black leather motorcycle jacket with silver hardware. A timeless statement piece.',
      price: '299.99',
      stock: 20,
      categoryId: womenCat.id,
      images: ['/attached_assets/generated_images/Black_leather_jacket_product_ec69504a.png'],
      sizes: ['XS', 'S', 'M', 'L'],
      badge: 'New Arrival',
      slug: 'leather-moto-jacket'
    },
    {
      title: 'Casual Chambray Shirt',
      description: 'Light and comfortable chambray shirt. Perfect for casual wear and easy to style.',
      price: '49.99',
      stock: 90,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Blue_casual_shirt_product_7b2ca7af.png'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      slug: 'casual-chambray-shirt'
    },
    {
      title: 'Slim Fit Khaki Chinos',
      description: 'Versatile khaki chinos with a modern slim fit. Essential for any wardrobe.',
      price: '79.99',
      stock: 75,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Khaki_chino_pants_product_7894fe61.png'],
      sizes: ['30', '32', '34', '36', '38'],
      badge: 'Bestseller',
      slug: 'slim-fit-khaki-chinos'
    },
    {
      title: 'Wool Overcoat',
      description: 'Elegant navy wool overcoat with premium tailoring. Perfect for winter.',
      price: '349.99',
      stock: 15,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Navy_wool_coat_product_66d09e85.png'],
      sizes: ['S', 'M', 'L', 'XL'],
      slug: 'wool-overcoat'
    },
    {
      title: 'Classic Denim Jacket',
      description: 'Timeless denim jacket in classic blue wash. A wardrobe staple for all seasons.',
      price: '89.99',
      stock: 65,
      categoryId: menCat.id,
      images: ['/attached_assets/generated_images/Denim_jacket_product_photo_8185c75b.png'],
      sizes: ['S', 'M', 'L', 'XL'],
      slug: 'classic-denim-jacket'
    },
    {
      title: 'Designer Aviator Sunglasses',
      description: 'Premium aviator sunglasses with UV protection. Classic style that never goes out of fashion.',
      price: '149.99',
      stock: 50,
      categoryId: accessoriesCat.id,
      images: ['/attached_assets/generated_images/Designer_sunglasses_product_photo_be595866.png'],
      slug: 'designer-aviator-sunglasses'
    },
    {
      title: 'Premium Leather Belt',
      description: 'Classic brown leather belt with silver buckle. Handcrafted from full-grain leather.',
      price: '59.99',
      stock: 100,
      categoryId: accessoriesCat.id,
      images: ['/attached_assets/generated_images/Leather_belt_product_photo_97ae3d82.png'],
      slug: 'premium-leather-belt'
    },
    {
      title: 'Minimalist Leather Wallet',
      description: 'Sleek black leather wallet with multiple card slots. Slim design fits perfectly in your pocket.',
      price: '79.99',
      stock: 85,
      categoryId: accessoriesCat.id,
      images: ['/attached_assets/generated_images/Black_leather_wallet_product_73d07b05.png'],
      slug: 'minimalist-leather-wallet'
    },
    {
      title: 'Silk Geometric Scarf',
      description: 'Luxurious silk scarf with modern geometric pattern. Adds elegance to any outfit.',
      price: '69.99',
      stock: 45,
      categoryId: accessoriesCat.id,
      images: ['/attached_assets/generated_images/Silk_scarf_product_photo_950de64e.png'],
      badge: 'New Arrival',
      slug: 'silk-geometric-scarf'
    },
    {
      title: 'Chelsea Ankle Boots',
      description: 'Stylish brown leather ankle boots with elastic side panels. Comfortable and versatile.',
      price: '139.99',
      stock: 40,
      categoryId: shoesCat.id,
      images: ['/attached_assets/generated_images/Brown_ankle_boots_product_57aa8be5.png'],
      sizes: ['6', '7', '8', '9', '10'],
      slug: 'chelsea-ankle-boots'
    },
    {
      title: 'Classic Leather Loafers',
      description: 'Timeless brown leather penny loafers. Perfect for both casual and formal occasions.',
      price: '119.99',
      stock: 55,
      categoryId: shoesCat.id,
      images: ['/attached_assets/generated_images/Brown_leather_loafers_product_23959941.png'],
      sizes: ['7', '8', '9', '10', '11', '12'],
      badge: 'Bestseller',
      slug: 'classic-leather-loafers'
    },
    {
      title: 'Performance Running Shoes',
      description: 'Modern athletic running shoes with superior cushioning and support. Built for performance.',
      price: '129.99',
      stock: 70,
      categoryId: shoesCat.id,
      images: ['/attached_assets/generated_images/Athletic_running_shoes_product_7a216f64.png'],
      sizes: ['7', '8', '9', '10', '11', '12', '13'],
      slug: 'performance-running-shoes'
    },
    {
      title: 'Classic Black Heels',
      description: 'Elegant black high heel pumps with pointed toe. A must-have for every wardrobe.',
      price: '99.99',
      stock: 50,
      categoryId: shoesCat.id,
      images: ['/attached_assets/generated_images/Black_high_heels_product_42c7e8dc.png'],
      sizes: ['6', '7', '8', '9', '10'],
      slug: 'classic-black-heels'
    },
  ]);

  console.log('✅ Created products');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@fashion.com / admin123');
  console.log('Customer: customer@example.com / customer123');
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
