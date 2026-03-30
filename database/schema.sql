-- Supabase PostgreSQL Schema for Khaane Me Kya Hai

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    apartment_name VARCHAR(255),
    flat_number VARCHAR(50),
    wing_or_tower VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Food listings table
CREATE TABLE IF NOT EXISTS food_listings (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(255) NOT NULL,
    seller_name VARCHAR(255),
    seller_apartment VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'lunch',
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    prep_time INTEGER DEFAULT 30,
    rating DECIMAL(2,1) DEFAULT 0,
    image TEXT DEFAULT 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    dietary_type VARCHAR(20) DEFAULT 'veg',
    order_time_start VARCHAR(10),
    order_time_end VARCHAR(10),
    delivery_time_start VARCHAR(10),
    delivery_time_end VARCHAR(10),
    allergens JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON food_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_apartment ON food_listings(seller_apartment);
CREATE INDEX IF NOT EXISTS idx_listings_category ON food_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_available ON food_listings(is_available);
