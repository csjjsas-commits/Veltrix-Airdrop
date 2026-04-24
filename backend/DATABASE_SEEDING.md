# Database Seeding and Cleanup Guide

## Overview

This backend has separate scripts for development and production database management:

- **Development**: Uses demo data for testing
- **Production**: Only creates essential admin user and configuration

## Scripts

### Production Setup

1. **Create Admin User** (from environment variables)
   ```bash
   npm run seed:admin
   ```
   - Creates/updates admin user using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - Safe to run multiple times (upserts instead of duplicates)

2. **Full Production Seed** (includes admin + config)
   ```bash
   npm run seed
   ```
   - Runs `prisma db push` to sync schema
   - Creates admin user, AirdropConfig, and SystemSettings
   - Safe for production - won't overwrite existing data

### Development Setup

1. **Demo Seed** (development only)
   ```bash
   # This is handled by seedDemoDatabase function
   # Only call this in development environments
   ```

### Cleanup

1. **Remove Demo Data**
   ```bash
   npm run cleanup:demo
   ```
   - Removes users with emails ending in `@airdrop.local`
   - Removes users with names starting with `Demo`
   - Cleans up related data (user tasks, analytics, referrals)
   - Updates community points total
   - **⚠️ Only run this after backing up your database**

## Environment Variables Required

### For Admin Creation
- `ADMIN_EMAIL`: Admin user's email
- `ADMIN_PASSWORD`: Admin user's password (will be hashed)
- `ADMIN_NAME`: Admin user's display name

### For Database
- `DATABASE_URL`: PostgreSQL connection string

## Safety Notes

- **Never run demo seed in production** - it will delete all data
- **Always backup before cleanup** - demo cleanup is destructive
- **Admin creation is safe** - uses upsert, won't create duplicates
- **Production seed is safe** - only creates missing config, doesn't overwrite

## Migration Path

If you have an existing database with demo data:

1. Backup your database
2. Run `npm run cleanup:demo` to remove demo users
3. Run `npm run seed:admin` to ensure admin exists
4. Your real users and data will remain intact