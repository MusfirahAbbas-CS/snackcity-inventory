using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using System.Drawing.Printing;

namespace SnacksCity
{
    public class ReceiptForm : Form
    {
        private Order order;
        private List<OrderLine> lines;
        private string restName, address, phone, receiptSize;
        private int paperWidth;
        private bool allowPrint;

        public ReceiptForm(int orderId, bool allowPrint)
        {
            this.order = DatabaseHelper.GetOrders().FirstOrDefault(o => o.id == orderId);
            this.allowPrint = allowPrint;
            
            var settings = DatabaseHelper.GetSettings();
            restName = settings.ContainsKey("restaurant_name") ? settings["restaurant_name"] : "SNACK CITY";
            address = settings.ContainsKey("address") ? settings["address"] : "";
            phone = settings.ContainsKey("contact") ? settings["contact"] : "";
            receiptSize = settings.ContainsKey("receipt_size") ? settings["receipt_size"] : "80mm";
            
            paperWidth = receiptSize == "58mm" ? 228 : 314;

            using (var conn = DatabaseHelper.GetConnection())
            {
                lines = Dapper.SqlMapper.Query<OrderLine>(conn, "SELECT * FROM order_lines WHERE order_id = @orderId", new { orderId }).ToList();
            }

            this.Text = "Receipt Preview (Two Separate Jobs)";
            this.Size = new Size(paperWidth + 120, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(243, 244, 246);

            FlowLayoutPanel flow = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoScroll = true, Padding = new Padding(20), FlowDirection = FlowDirection.TopDown, WrapContents = false };
            this.Controls.Add(flow);

            int custHeight = GetCustomerHeight();
            int kitchHeight = GetKitchenHeight();

            // Label for Customer Receipt
            Label lblC = new Label { Text = "Customer Receipt", Font = new Font("Segoe UI", 10, FontStyle.Bold), AutoSize = true, Margin = new Padding((this.ClientSize.Width - paperWidth)/2, 0, 0, 5) };
            flow.Controls.Add(lblC);

            Panel pnlCust = new Panel { Width = paperWidth, Height = custHeight, BackColor = Color.White, Margin = new Padding((this.ClientSize.Width - paperWidth)/2, 0, 0, 20) };
            pnlCust.Paint += (s, e) => DrawCustomerReceipt(e.Graphics, paperWidth);
            flow.Controls.Add(pnlCust);

            // Label for Kitchen Ticket
            Label lblK = new Label { Text = "Kitchen Ticket", Font = new Font("Segoe UI", 10, FontStyle.Bold), AutoSize = true, Margin = new Padding((this.ClientSize.Width - paperWidth)/2, 0, 0, 5) };
            flow.Controls.Add(lblK);

            Panel pnlKitch = new Panel { Width = paperWidth, Height = kitchHeight, BackColor = Color.White, Margin = new Padding((this.ClientSize.Width - paperWidth)/2, 0, 0, 20) };
            pnlKitch.Paint += (s, e) => DrawKitchenTicket(e.Graphics, paperWidth);
            flow.Controls.Add(pnlKitch);
            
            flow.Resize += (s, e) => {
                lblC.Margin = new Padding((flow.ClientSize.Width - paperWidth)/2, 0, 0, 5);
                pnlCust.Margin = new Padding((flow.ClientSize.Width - paperWidth)/2, 0, 0, 20);
                lblK.Margin = new Padding((flow.ClientSize.Width - paperWidth)/2, 0, 0, 5);
                pnlKitch.Margin = new Padding((flow.ClientSize.Width - paperWidth)/2, 0, 0, 20);
            };

            if (allowPrint && order != null && order.printed == 0)
            {
                Button btnPrint = new Button { Text = "Print Receipts", Dock = DockStyle.Bottom, Height = 60, BackColor = Color.FromArgb(234, 88, 12), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Font = new Font("Segoe UI", 12, FontStyle.Bold) };
                btnPrint.FlatAppearance.BorderSize = 0;
                btnPrint.Click += (s, e) => {
                    try {
                        PrintDocument pdCust = new PrintDocument();
                        pdCust.DefaultPageSettings.PaperSize = new PaperSize("Customer", paperWidth, GetCustomerHeight());
                        pdCust.PrintPage += (sender, ev) => DrawCustomerReceipt(ev.Graphics, paperWidth);
                        pdCust.Print();

                        PrintDocument pdKitch = new PrintDocument();
                        pdKitch.DefaultPageSettings.PaperSize = new PaperSize("Kitchen", paperWidth, GetKitchenHeight());
                        pdKitch.PrintPage += (sender, ev) => DrawKitchenTicket(ev.Graphics, paperWidth);
                        pdKitch.Print();

                        DatabaseHelper.MarkOrderPrinted(order.id);
                        btnPrint.Enabled = false;
                        btnPrint.Text = "Printed (Cannot reprint)";
                        btnPrint.BackColor = Color.Gray;
                        MessageBox.Show("Printed customer & kitchen receipts successfully. They have been sent as two separate print jobs to automatically cut.");
                    } catch (Exception ex) { MessageBox.Show("Print error: " + ex.Message); }
                };
                this.Controls.Add(btnPrint);
                // Adjust layout so button doesn't hide flow content
                flow.Padding = new Padding(20, 20, 20, 80);
            }
            else if (order != null && order.printed == 1)
            {
                Label lblAlready = new Label { Text = "âš  This receipt has already been printed.", Dock = DockStyle.Bottom, Height = 40, TextAlign = ContentAlignment.MiddleCenter, ForeColor = Color.White, BackColor = Color.IndianRed, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
                this.Controls.Add(lblAlready);
                flow.Padding = new Padding(20, 20, 20, 60);
            }
        }

        private int GetCustomerHeight() {
            int h = 170; 
            if (!string.IsNullOrEmpty(address)) h += 15;
            if (!string.IsNullOrEmpty(phone)) h += 15;
            if (!string.IsNullOrEmpty(order.customer_name)) h += 15;
            if (!string.IsNullOrEmpty(order.customer_phone)) h += 15;
            h += lines.Count * 25; 
            h += 140; 
            return h;
        }

        private int GetKitchenHeight() {
            return 140 + (lines.Count * 25) + 30;
        }

        private void DrawCustomerReceipt(Graphics g, int width)
        {
            if (order == null) return;
            width = width - 10;
            Font fontBold = new Font("Segoe UI", 10, FontStyle.Bold);
            Font fontNormal = new Font("Segoe UI", 9, FontStyle.Regular);
            Font fontSmall = new Font("Segoe UI", 8, FontStyle.Regular);
            Font fontLarge = new Font("Segoe UI", 12, FontStyle.Bold);
            Pen dashedPen = new Pen(Color.Black, 1) { DashStyle = System.Drawing.Drawing2D.DashStyle.Dash };
            
            int y = 10;
            StringFormat centerFormat = new StringFormat { Alignment = StringAlignment.Center };
            StringFormat rightFormat = new StringFormat { Alignment = StringAlignment.Far };
            
            g.DrawString(restName.ToUpper(), fontLarge, Brushes.Black, new RectangleF(0, y, width, 25), centerFormat); y += 25;
            if (!string.IsNullOrEmpty(address)) { g.DrawString(address, fontSmall, Brushes.Black, new RectangleF(0, y, width, 15), centerFormat); y += 15; }
            if (!string.IsNullOrEmpty(phone)) { g.DrawString(phone, fontSmall, Brushes.Black, new RectangleF(0, y, width, 15), centerFormat); y += 15; }
            
            y += 10;
            g.DrawString("Order receipt", fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), centerFormat); y += 20;
            g.DrawString($"# {order.id} - {order.FormattedDate}", fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), centerFormat); y += 20;
            
            if (!string.IsNullOrEmpty(order.customer_name)) { g.DrawString($"Customer: {order.customer_name}", fontSmall, Brushes.Black, new RectangleF(0, y, width, 15), centerFormat); y += 15; }
            if (!string.IsNullOrEmpty(order.customer_phone)) { g.DrawString($"Phone: {order.customer_phone}", fontSmall, Brushes.Black, new RectangleF(0, y, width, 15), centerFormat); y += 15; }
            
            y += 10;
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            
            g.DrawString("Item", fontBold, Brushes.Black, 0, y);
            g.DrawString("Qty", fontBold, Brushes.Black, width / 2 + 10, y);
            g.DrawString("Price", fontBold, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat);
            y += 20;
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            
            foreach (var line in lines) {
                g.DrawString(line.item_name, fontNormal, Brushes.Black, new RectangleF(0, y, width/2 + 5, 40)); 
                g.DrawString(line.quantity.ToString(), fontNormal, Brushes.Black, width / 2 + 10, y);
                g.DrawString((line.line_total_paisa/100.0).ToString("0.00"), fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat);
                y += 25; 
            }
            
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            
            g.DrawString("TOTAL", fontBold, Brushes.Black, 0, y);
            g.DrawString("Rs " + order.TotalRs.ToString("0.00"), fontBold, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat); y += 20;
            g.DrawString("Paid Amount", fontNormal, Brushes.Black, 0, y);
            g.DrawString("Rs " + order.PaidRs.ToString("0.00"), fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat); y += 20;
            g.DrawString("Change", fontNormal, Brushes.Black, 0, y);
            g.DrawString("Rs " + order.ChangeRs.ToString("0.00"), fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat); y += 20;
            
            y += 10;
            g.DrawString("Thank you!", fontNormal, Brushes.Black, new RectangleF(0, y, width, 20), centerFormat);
        }

        private void DrawKitchenTicket(Graphics g, int width)
        {
            if (order == null) return;
            width = width - 10;
            Font fontBold = new Font("Segoe UI", 10, FontStyle.Bold);
            Font fontSmall = new Font("Segoe UI", 8, FontStyle.Regular);
            Font fontLarge = new Font("Segoe UI", 12, FontStyle.Bold);
            Pen dashedPen = new Pen(Color.Black, 1) { DashStyle = System.Drawing.Drawing2D.DashStyle.Dash };
            
            int y = 10;
            StringFormat centerFormat = new StringFormat { Alignment = StringAlignment.Center };
            StringFormat rightFormat = new StringFormat { Alignment = StringAlignment.Far };

            g.DrawString("KITCHEN TICKET", new Font("Segoe UI", 11, FontStyle.Bold), Brushes.Black, new RectangleF(0, y, width, 20), centerFormat); y += 25;
            g.DrawString($"Order #{order.id}", fontLarge, Brushes.Black, new RectangleF(0, y, width, 20), centerFormat); y += 20;
            g.DrawString(order.FormattedDate, fontSmall, Brushes.Black, new RectangleF(0, y, width, 15), centerFormat); y += 20;
            
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            g.DrawString("Item", fontBold, Brushes.Black, 0, y);
            g.DrawString("Qty", fontBold, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat);
            y += 20;
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            
            foreach (var line in lines) {
                g.DrawString(line.item_name, fontBold, Brushes.Black, new RectangleF(0, y, width - 30, 40));
                g.DrawString(line.quantity.ToString(), fontBold, Brushes.Black, new RectangleF(0, y, width, 20), rightFormat);
                y += 25;
            }
            g.DrawLine(dashedPen, 0, y, width, y); y += 5;
            g.DrawString("End of ticket", new Font("Segoe UI", 8, FontStyle.Italic), Brushes.Black, new RectangleF(0, y, width, 20), centerFormat);
        }
    }
}
