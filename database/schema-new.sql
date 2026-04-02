-- ============================================
-- Backend Database Schema
-- For Render/Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    apartment_name VARCHAR(255),
    flat_number VARCHAR(50),
    wing_or_tower VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================
-- FOOD LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS food_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_name VARCHAR(255),
    seller_apartment VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'lunch',
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_listings_seller ON food_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_apartment ON food_listings(seller_apartment);
CREATE INDEX IF NOT EXISTS idx_listings_category ON food_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_available ON food_listings(is_available);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    listing_id UUID NOT NULL REFERENCES food_listings(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- APARTMENTS REFERENCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Bangalore',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default apartments
INSERT INTO apartments (name, address) VALUES
('Prestige Shantiniketan', 'Whitefield, Bangalore'),
('Prestige Ferns Residency', 'Haralur Road, Bangalore'),
('Sobha Dream Acres', 'Panathur Road, Bangalore'),
('Brigade Metropolis', 'Whitefield, Bangalore')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_listings_updated_at ON food_listings;
CREATE TRIGGER update_food_listings_updated_at BEFORE UPDATE ON food_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
