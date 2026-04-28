import { Product } from "../contexts/CartContext";

export const products: Product[] = [
  // Vegetables
  {
    id: "veg-1",
    name: "Tomato",
    price: 30,
    image: "🍅",
    category: "Vegetables",
    unit: "kg",
    description: "Fresh red tomatoes",
  },
  {
    id: "veg-2",
    name: "Onion",
    price: 25,
    image: "🧅",
    category: "Vegetables",
    unit: "kg",
    description: "Fresh onions",
  },
  {
    id: "veg-3",
    name: "Potato",
    price: 20,
    image: "🥔",
    category: "Vegetables",
    unit: "kg",
    description: "Farm fresh potatoes",
  },
  {
    id: "veg-4",
    name: "Carrot",
    price: 40,
    image: "🥕",
    category: "Vegetables",
    unit: "kg",
    description: "Crunchy carrots",
  },
  {
    id: "veg-5",
    name: "Broccoli",
    price: 60,
    image: "🥦",
    category: "Vegetables",
    unit: "kg",
    description: "Fresh green broccoli",
  },
  {
    id: "veg-6",
    name: "Bell Pepper",
    price: 50,
    image: "🫑",
    category: "Vegetables",
    unit: "kg",
    description: "Colorful bell peppers",
  },

  // Fruits
  {
    id: "fruit-1",
    name: "Apple",
    price: 120,
    image: "🍎",
    category: "Fruits",
    unit: "kg",
    description: "Crispy red apples",
  },
  {
    id: "fruit-2",
    name: "Banana",
    price: 40,
    image: "🍌",
    category: "Fruits",
    unit: "dozen",
    description: "Ripe bananas",
  },
  {
    id: "fruit-3",
    name: "Orange",
    price: 80,
    image: "🍊",
    category: "Fruits",
    unit: "kg",
    description: "Juicy oranges",
  },
  {
    id: "fruit-4",
    name: "Mango",
    price: 150,
    image: "🥭",
    category: "Fruits",
    unit: "kg",
    description: "Sweet mangoes",
  },
  {
    id: "fruit-5",
    name: "Grapes",
    price: 100,
    image: "🍇",
    category: "Fruits",
    unit: "kg",
    description: "Fresh grapes",
  },
  {
    id: "fruit-6",
    name: "Watermelon",
    price: 30,
    image: "🍉",
    category: "Fruits",
    unit: "kg",
    description: "Sweet watermelon",
  },

  // Groceries
  {
    id: "grocery-1",
    name: "Rice",
    price: 50,
    image: "🍚",
    category: "Groceries",
    unit: "kg",
    description: "Premium basmati rice",
  },
  {
    id: "grocery-2",
    name: "Wheat Flour",
    price: 40,
    image: "🌾",
    category: "Groceries",
    unit: "kg",
    description: "Whole wheat flour",
  },
  {
    id: "grocery-3",
    name: "Milk",
    price: 60,
    image: "🥛",
    category: "Groceries",
    unit: "litre",
    description: "Fresh milk",
  },
  {
    id: "grocery-4",
    name: "Eggs",
    price: 70,
    image: "🥚",
    category: "Groceries",
    unit: "dozen",
    description: "Farm fresh eggs",
  },
  {
    id: "grocery-5",
    name: "Bread",
    price: 40,
    image: "🍞",
    category: "Groceries",
    unit: "pack",
    description: "Fresh bread",
  },
  {
    id: "grocery-6",
    name: "Cheese",
    price: 200,
    image: "🧀",
    category: "Groceries",
    unit: "kg",
    description: "Premium cheese",
  },
];

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  section: string;
}

export const categories: Category[] = [
  // Grocery & Kitchen Section
  {
    id: "vegetables",
    name: "Vegetables",
    icon: "🥬",
    description: "Fresh farm vegetables",
    section: "Grocery & Kitchen",
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: "🍎",
    description: "Fresh seasonal fruits",
    section: "Grocery & Kitchen",
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs",
    icon: "🥛",
    description: "Milk, bread, eggs & more",
    section: "Grocery & Kitchen",
  },
  {
    id: "atta-rice-oils-dals",
    name: "Atta, Rice, Oils & Dals",
    icon: "🌾",
    description: "Kitchen staples",
    section: "Grocery & Kitchen",
  },
  {
    id: "masala-dry-fruits",
    name: "Masala & Dry Fruits",
    icon: "🌶️",
    description: "Spices & dry fruits",
    section: "Grocery & Kitchen",
  },
  {
    id: "packaged-foods",
    name: "Packaged Foods",
    icon: "📦",
    description: "Ready to cook & eat",
    section: "Grocery & Kitchen",
  },

  // Snacks & Drinks
  {
    id: "tea-coffee-more",
    name: "Tea, Coffee & More",
    icon: "☕",
    description: "Hot beverages",
    section: "Snacks & Drinks",
  },
  {
    id: "ice-creams-more",
    name: "Ice creams & More",
    icon: "🍦",
    description: "Frozen treats",
    section: "Snacks & Drinks",
  },
  {
    id: "sweet-cravings",
    name: "Sweet Cravings",
    icon: "🍬",
    description: "Candies & sweets",
    section: "Snacks & Drinks",
  },
  {
    id: "cold-drinks-juice",
    name: "Cold Drinks & Juice",
    icon: "🥤",
    description: "Refreshing beverages",
    section: "Snacks & Drinks",
  },
  {
    id: "munchies",
    name: "Munchies",
    icon: "🍿",
    description: "Savory snacks",
    section: "Snacks & Drinks",
  },
  {
    id: "biscuits-cookies",
    name: "Biscuits & Cookies",
    icon: "🍪",
    description: "Sweet & savory biscuits",
    section: "Snacks & Drinks",
  },

  // Household Essentials
  {
    id: "home-needs",
    name: "Home Needs",
    icon: "🏠",
    description: "Home essentials",
    section: "Household Essentials",
  },
  {
    id: "cleaning-essentials",
    name: "Cleaning Essentials",
    icon: "🧹",
    description: "Cleaning supplies",
    section: "Household Essentials",
  },
  {
    id: "toys-sports",
    name: "Toys & Sports",
    icon: "⚽",
    description: "Kids toys & sports gear",
    section: "Household Essentials",
  },
  {
    id: "stationery-books",
    name: "Stationery & Books",
    icon: "📚",
    description: "Books & stationery items",
    section: "Household Essentials",
  },
];

export const categorySections = [
  "Grocery & Kitchen",
  "Snacks & Drinks",
  "Household Essentials",
];
