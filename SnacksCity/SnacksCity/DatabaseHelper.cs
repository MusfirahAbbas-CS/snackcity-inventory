using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Linq;
using Dapper;

namespace SnacksCity
{
    public static class DatabaseHelper
    {
        // Using "Data Source=inventory.db" means it will look in the same folder as the .exe
        private static string GetConnectionString()
        {
            string dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "inventory.db");
            return $"Data Source={dbPath};Version=3;";
        }

        public static SQLiteConnection GetConnection()
        {
            var conn = new SQLiteConnection(GetConnectionString());
            conn.Open();
            return conn;
        }

        public static bool VerifyDatabaseConnection()
        {
            try
            {
                using (var conn = GetConnection())
                {
                    int count = conn.QuerySingle<int>("SELECT count(*) FROM sqlite_master WHERE type='table'");
                    return count > 0;
                }
            }
            catch (Exception)
            {
                return false;
            }
        }
        
        public static User AuthenticateUser(string password)
        {
            using (var conn = GetConnection())
            {
                // Fetch the admin password from the settings table
                string adminPwd = conn.QueryFirstOrDefault<string>("SELECT value FROM settings WHERE key = 'admin_password'") ?? "admin";

                if (password == adminPwd)
                {
                    return new User { id = 1, role = "admin" };
                }
                else if (password == "staff")
                {
                    return new User { id = 2, role = "staff" };
                }
                
                return null; // Invalid password
            }
        }

        public static List<Item> GetItems()
        {
            using (var conn = GetConnection()) { return conn.Query<Item>("SELECT * FROM items ORDER BY name").ToList(); }
        }

        public static List<MenuItem> GetMenuItems()
        {
            using (var conn = GetConnection()) { return conn.Query<MenuItem>("SELECT * FROM menu_items WHERE active = 1 ORDER BY name").ToList(); }
        }

        // --- MENU LOGIC ---
        public static void CreateMenuItem(string name, double priceRs)
        {
            using (var conn = GetConnection())
            {
                int pricePaisa = (int)(priceRs * 100);
                var existing = conn.QueryFirstOrDefault<MenuItem>("SELECT * FROM menu_items WHERE name = @name", new { name });
                if (existing != null)
                {
                    if (existing.active == 1) throw new Exception($"Menu item '{name}' already exists.");
                    conn.Execute("UPDATE menu_items SET active = 1, price_paisa = @pricePaisa WHERE id = @id", new { pricePaisa, id = existing.id });
                }
                else
                {
                    conn.Execute("INSERT INTO menu_items (name, price_paisa) VALUES (@name, @pricePaisa)", new { name, pricePaisa });
                }
            }
        }

        public static void UpdateMenuItem(int id, double priceRs)
        {
            using (var conn = GetConnection())
            {
                conn.Execute("UPDATE menu_items SET price_paisa = @pricePaisa WHERE id = @id", new { pricePaisa = (int)(priceRs * 100), id });
            }
        }

        public static void UpdateMenuItem(int id, string name, double price) { using (var conn = GetConnection()) { conn.Execute("UPDATE menu_items SET name = @name, price_paisa = @pricePaisa WHERE id = @id", new { id, name, pricePaisa = (int)(price * 100) }); } }

        public static void DeleteMenuItem(int id)
        {
            using (var conn = GetConnection()) { conn.Execute("UPDATE menu_items SET active = 0 WHERE id = @id", new { id }); }
        }

        // --- INVENTORY LOGIC ---
        public static void CreateItem(string name, string category, string unit, double costRs, double initialStock)
        {
            using (var conn = GetConnection())
            {
                int pricePaisa = (int)(costRs * 100);
                conn.Execute("INSERT INTO items (name, category, unit, quantity, price_paisa) VALUES (@name, @category, @unit, @initialStock, @pricePaisa)",
                    new { name, category, unit, initialStock, pricePaisa });
            }
        }

        public static void DeleteItem(int id)
        {
            using (var conn = GetConnection())
            {
                conn.Execute("DELETE FROM movements WHERE item_id = @id", new { id });
                conn.Execute("DELETE FROM items WHERE id = @id", new { id });
            }
        }

        public static void AddStock(int id, double amount, string reason = "Restock")
        {
            using (var conn = GetConnection())
            {
                conn.Execute("INSERT INTO movements (item_id, change, reason, created_at) VALUES (@id, @amount, @reason, @date)",
                    new { id, amount, reason, date = DateTime.UtcNow.ToString("O") });
                conn.Execute("UPDATE items SET quantity = quantity + @amount WHERE id = @id", new { amount, id });
            }
        }

        // --- SETTINGS LOGIC ---
        public static Dictionary<string, string> GetSettings()
        {
            using (var conn = GetConnection())
            {
                var rows = conn.Query("SELECT key, value FROM settings").ToList();
                var dict = new Dictionary<string, string>();
                foreach (var row in rows) { dict[(string)row.key] = (string)row.value; }
                return dict;
            }
        }

        public static void SaveSetting(string key, string value)
        {
            using (var conn = GetConnection())
            {
                conn.Execute("INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value=excluded.value", new { key, value });
            }
        }

        // --- ORDERS LOGIC ---
        public static int CreateOrder(double totalRs, double paidRs, string customerName, string customerPhone, List<OrderLine> lines)
        {
            using (var conn = GetConnection())
            {
                int totalPaisa = (int)(totalRs * 100);
                int paidPaisa = (int)(paidRs * 100);
                string now = DateTime.UtcNow.ToString("O");
                string today = now.Substring(0, 10);
                
                int maxDaily = conn.QueryFirstOrDefault<int>("SELECT COALESCE(MAX(daily_number), 0) FROM orders WHERE date(created_at) = @today", new { today });
                int dailyNumber = maxDaily + 1;

                string sqlOrder = "INSERT INTO orders (created_at, total_paisa, amount_tendered_paisa, daily_number, customer_name, customer_phone, printed) VALUES (@now, @totalPaisa, @paidPaisa, @dailyNumber, @customerName, @customerPhone, 0); SELECT last_insert_rowid();";
                int orderId = conn.QuerySingle<int>(sqlOrder, new { now, totalPaisa, paidPaisa, dailyNumber, customerName, customerPhone });

                foreach (var line in lines)
                {
                    conn.Execute("INSERT INTO order_lines (order_id, menu_item_id, item_name, quantity, unit_price_paisa, line_total_paisa) VALUES (@orderId, @menu_item_id, @item_name, @quantity, @unit_price_paisa, @line_total_paisa)",
                        new { orderId, line.menu_item_id, line.item_name, line.quantity, line.unit_price_paisa, line.line_total_paisa });
                }
                
                return orderId;
            }
        }

        public static List<Order> GetOrders()
        {
            using (var conn = GetConnection())
            {
                return conn.Query<Order>("SELECT * FROM orders ORDER BY id DESC LIMIT 50").ToList();
            }
        }

        public static void MarkOrderPrinted(int orderId) { using (var conn = GetConnection()) { conn.Execute("UPDATE orders SET printed = 1 WHERE id = @orderId", new { orderId }); } }

        public static void ChangePassword(string newPassword) { using (var conn = GetConnection()) { conn.Execute("INSERT INTO settings (key, value) VALUES ('admin_password', @newPassword) ON CONFLICT(key) DO UPDATE SET value=excluded.value", new { newPassword }); } }

        public static void DeleteOrder(int orderId)
        {
            using (var conn = GetConnection())
            {
                conn.Execute("DELETE FROM order_lines WHERE order_id = @orderId", new { orderId });
                conn.Execute("DELETE FROM orders WHERE id = @orderId", new { orderId });
            }
        }

        // --- REPORTS LOGIC ---
        public static List<dynamic> GetSalesReport(string period = "daily")
        {
            using (var conn = GetConnection())
            {
                string grp = "substr(created_at, 1, 10)";
                if (period == "yearly") grp = "substr(created_at, 1, 4)";
                if (period == "monthly") grp = "substr(created_at, 1, 7)";
                
                return conn.Query($"SELECT {grp} as date, SUM(total_paisa) as total_sales, COUNT(id) as order_count FROM orders GROUP BY {grp} ORDER BY {grp} DESC LIMIT 100").ToList();
            }
        }

        public static List<dynamic> GetPurchaseReport(string period = "daily")
        {
            using (var conn = GetConnection())
            {
                string grp = "substr(movements.created_at, 1, 10)";
                if (period == "yearly") grp = "substr(movements.created_at, 1, 4)";
                if (period == "monthly") grp = "substr(movements.created_at, 1, 7)";

                return conn.Query($"SELECT {grp} as date, SUM(movements.change * items.price_paisa) as total_cost, COUNT(movements.id) as movement_count FROM movements JOIN items ON items.id = movements.item_id WHERE movements.change > 0 GROUP BY {grp} ORDER BY {grp} DESC LIMIT 100").ToList();
            }
        }
    }

    public class User { public int id { get; set; } public string role { get; set; } }

    public class Order
    {
        public int id { get; set; }
        public string created_at { get; set; }
        public int total_paisa { get; set; }
        public string customer_name { get; set; }
        public string customer_phone { get; set; }
        public int amount_tendered_paisa { get; set; }
        public int printed { get; set; }
        public double TotalRs => total_paisa / 100.0;
        public double PaidRs => amount_tendered_paisa / 100.0;
        public double ChangeRs => (amount_tendered_paisa - total_paisa) / 100.0;
        public string FormattedDate => DateTime.Parse(created_at).ToString("dd/MM/yyyy, HH:mm:ss");
    }

    public class OrderLine
    {
        public int menu_item_id { get; set; }
        public string item_name { get; set; }
        public int quantity { get; set; }
        public int unit_price_paisa { get; set; }
        public int line_total_paisa { get; set; }
    }

    public class Item
    {
        public int id { get; set; }
        public string name { get; set; }
        public string category { get; set; }
        public string unit { get; set; }
        public double quantity { get; set; }
        public double reorder_level { get; set; }
        public int price_paisa { get; set; }
        
        public double PriceRs => price_paisa / 100.0;
        public string StockString => $"{quantity} {unit}";
    }

    public class MenuItem
    {
        public int id { get; set; }
        public string name { get; set; }
        public int price_paisa { get; set; }
        public int active { get; set; }
        
        public double PriceRs => price_paisa / 100.0;
    }
}
