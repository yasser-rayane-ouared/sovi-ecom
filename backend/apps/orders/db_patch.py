"""
Database schema auto-healer.
Ensures critical missing columns (e.g. delivery_method) exist in PostgreSQL and SQLite
without failing if migrations were out of sync.
"""
import logging
from django.db import connection

logger = logging.getLogger(__name__)

def auto_heal_schema():
    try:
        with connection.cursor() as cursor:
            vendor = connection.vendor
            if vendor == 'postgresql':
                statements = [
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'home';",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) DEFAULT 0;",
                    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2);",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS ad_cost_per_order NUMERIC(10, 2) DEFAULT 0;",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS badges TEXT DEFAULT '';",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS enable_ab_test BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS name_en VARCHAR(100) DEFAULT '';",
                    "ALTER TABLE communes ADD COLUMN IF NOT EXISTS name_en VARCHAR(100) DEFAULT '';",
                    "ALTER TABLE communes ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10) DEFAULT '';",
                    "ALTER TABLE quantity_offers ADD COLUMN IF NOT EXISTS label VARCHAR(255) DEFAULT '';",
                ]
                for stmt in statements:
                    try:
                        cursor.execute(stmt)
                    except Exception as e:
                        logger.warning("auto_heal_schema statement failed: %s -> %s", stmt, e)
                logger.info("PostgreSQL schema auto-healing completed successfully.")
            elif vendor == 'sqlite':
                # Check orders columns
                cursor.execute("PRAGMA table_info(orders)")
                cols = [row[1] for row in cursor.fetchall()]
                if 'delivery_method' not in cols:
                    try:
                        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(20) DEFAULT 'home'")
                    except Exception:
                        pass
                if 'coupon_code' not in cols:
                    try:
                        cursor.execute("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT ''")
                    except Exception:
                        pass
                if 'coupon_discount' not in cols:
                    try:
                        cursor.execute("ALTER TABLE orders ADD COLUMN coupon_discount NUMERIC(10, 2) DEFAULT 0")
                    except Exception:
                        pass
                if 'inventory_deducted' not in cols:
                    try:
                        cursor.execute("ALTER TABLE orders ADD COLUMN inventory_deducted BOOLEAN DEFAULT 0")
                    except Exception:
                        pass
                
                # Check products columns
                cursor.execute("PRAGMA table_info(products)")
                p_cols = [row[1] for row in cursor.fetchall()]
                if 'cost_price' not in p_cols:
                    try:
                        cursor.execute("ALTER TABLE products ADD COLUMN cost_price NUMERIC(10, 2)")
                    except Exception:
                        pass
                if 'ad_cost_per_order' not in p_cols:
                    try:
                        cursor.execute("ALTER TABLE products ADD COLUMN ad_cost_per_order NUMERIC(10, 2) DEFAULT 0")
                    except Exception:
                        pass
    except Exception as e:
        logger.warning("auto_heal_schema encountered error: %s", str(e))
