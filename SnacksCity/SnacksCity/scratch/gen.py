import os

code = """using System;
using System.Drawing;
using System.Windows.Forms;
using System.Linq;
using System.Collections.Generic;

namespace SnacksCity
{
    public partial class MainForm : Form
    {
        private User _currentUser;
        
        // UI Controls
        private Panel sidebarPanel;
        private Panel contentPanel;
        
        private Button btnOrders, btnInventory, btnMenu, btnOrdersHistory, btnReports, btnSettings, btnLogout;
        private Button activeSidebarButton;
        
        private bool isSidebarExpanded = true;
        private Button btnToggleSidebar;
        private Label lblPos, lblSnackCity, lblRole;

        // State
        private List<OrderLine> _currentCart = new List<OrderLine>();

        public MainForm(User user)
        {
            _currentUser = user;
            InitializeComponent();
            SetupUI();
            ShowOrders();
        }
        
        private void InitializeComponent() { }

        private void SetupUI()
        {
            this.Text = "Snack City POS - Dashboard";
            this.Size = new Size(1280, 800);
            this.MinimumSize = new Size(1024, 720);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(243, 244, 246);
            try { this.Icon = new Icon(@"..\..\..\..\frontend\public\icon.ico"); } catch { }

            sidebarPanel = new Panel { Dock = DockStyle.Left, Width = 250, BackColor = Color.FromArgb(11, 17, 30) };
            this.Controls.Add(sidebarPanel);

            btnToggleSidebar = new Button { Text = "≡", ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Font = new Font("Segoe UI", 16, FontStyle.Bold), Size = new Size(40, 40), Location = new Point(200, 10), Cursor = Cursors.Hand };
            btnToggleSidebar.FlatAppearance.BorderSize = 0;
            btnToggleSidebar.Click += (s, e) => ToggleSidebar();
            sidebarPanel.Controls.Add(btnToggleSidebar);

            lblPos = new Label { Text = "POINT OF SALE", ForeColor = Color.FromArgb(234, 88, 12), Font = new Font("Segoe UI", 9, FontStyle.Bold), AutoSize = true, Location = new Point(20, 20) };
            lblSnackCity = new Label { Text = "SNACK CITY", ForeColor = Color.White, Font = new Font("Segoe UI Black", 16, FontStyle.Bold), AutoSize = true, Location = new Point(16, 40) };
            lblRole = new Label { Text = $"Role: {_currentUser.role}", ForeColor = Color.Gray, Font = new Font("Segoe UI", 9), AutoSize = true, Location = new Point(20, 70) };
            
            sidebarPanel.Controls.Add(lblPos);
            sidebarPanel.Controls.Add(lblSnackCity);
            sidebarPanel.Controls.Add(lblRole);

            int startY = 120;
            btnOrders = CreateSidebarButton("🛒  Orders", startY);
            btnInventory = CreateSidebarButton("📦  Inventory", startY + 50);
            btnMenu = CreateSidebarButton("🍴  Menu", startY + 100);
            btnOrdersHistory = CreateSidebarButton("🕒  Orders History", startY + 150);
            btnReports = CreateSidebarButton("📊  Reports", startY + 200);
            btnSettings = CreateSidebarButton("⚙  Settings", startY + 250);

            btnOrders.Click += (s, e) => ShowOrders();
            btnInventory.Click += (s, e) => ShowInventory();
            btnMenu.Click += (s, e) => ShowMenu();
            btnOrdersHistory.Click += (s, e) => ShowOrdersHistory();
            btnReports.Click += (s, e) => ShowReports();
            btnSettings.Click += (s, e) => ShowSettings();

            btnLogout = CreateSidebarButton("🚪  Logout", this.ClientSize.Height - 80);
            btnLogout.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            btnLogout.ForeColor = Color.FromArgb(239, 68, 68);
            btnLogout.Click += BtnLogout_Click;

            contentPanel = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(243, 244, 246), Padding = new Padding(30) };
            this.Controls.Add(contentPanel);
            contentPanel.BringToFront();
        }

        private void ToggleSidebar()
        {
            isSidebarExpanded = !isSidebarExpanded;
            sidebarPanel.Width = isSidebarExpanded ? 250 : 60;
            btnToggleSidebar.Location = new Point(isSidebarExpanded ? 200 : 10, 10);
            
            lblPos.Visible = isSidebarExpanded;
            lblSnackCity.Visible = isSidebarExpanded;
            lblRole.Visible = isSidebarExpanded;

            Button[] btns = { btnOrders, btnInventory, btnMenu, btnOrdersHistory, btnReports, btnSettings, btnLogout };
            foreach (var btn in btns)
            {
                btn.Width = isSidebarExpanded ? 210 : 40;
                btn.Text = isSidebarExpanded ? btn.Tag.ToString() : btn.Tag.ToString().Substring(0, 2);
            }
        }

        private Button CreateSidebarButton(string text, int yPosition)
        {
            Button btn = new Button
            {
                Text = text, Tag = text,
                ForeColor = Color.White, BackColor = Color.Transparent, FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 11, FontStyle.Regular), Width = 210, Height = 45, Location = new Point(10, yPosition),
                Cursor = Cursors.Hand, TextAlign = ContentAlignment.MiddleLeft, Padding = new Padding(10, 0, 0, 0)
            };
            btn.FlatAppearance.BorderSize = 0;
            btn.FlatAppearance.MouseOverBackColor = Color.FromArgb(31, 41, 55);
            sidebarPanel.Controls.Add(btn);
            return btn;
        }

        private void SetActiveButton(Button btn)
        {
            if (activeSidebarButton != null) { 
                activeSidebarButton.BackColor = Color.Transparent;
                activeSidebarButton.ForeColor = Color.White;
            }
            activeSidebarButton = btn;
            activeSidebarButton.BackColor = Color.FromArgb(234, 88, 12);
            activeSidebarButton.ForeColor = Color.White;
        }

        // --- STYLED COMPONENTS HELPERS ---
        private Panel CreateCardPanel(string title)
        {
            Panel p = new Panel { BackColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
            if (!string.IsNullOrEmpty(title))
            {
                Label lbl = new Label { Text = title, Font = new Font("Segoe UI", 16, FontStyle.Bold), AutoSize = true, Location = new Point(20, 20) };
                p.Controls.Add(lbl);
            }
            return p;
        }

        private TextBox CreateInput(string placeholder, int x, int y, int width, Panel parent)
        {
            TextBox txt = new TextBox { Text = placeholder, Font = new Font("Segoe UI", 11), ForeColor = Color.Gray, Location = new Point(x, y), Width = width, BorderStyle = BorderStyle.FixedSingle };
            txt.Enter += (s, e) => { if (txt.Text == placeholder) { txt.Text = ""; txt.ForeColor = Color.Black; } };
            txt.Leave += (s, e) => { if (string.IsNullOrWhiteSpace(txt.Text)) { txt.Text = placeholder; txt.ForeColor = Color.Gray; } };
            parent.Controls.Add(txt);
            return txt;
        }

        private Label CreateLabel(string text, int x, int y, Panel parent)
        {
            Label lbl = new Label { Text = text, Font = new Font("Segoe UI", 9), AutoSize = true, Location = new Point(x, y) };
            parent.Controls.Add(lbl);
            return lbl;
        }

        private Button CreateOrangeButton(string text, int x, int y, int width, Panel parent)
        {
            Button btn = new Button { Text = text, Font = new Font("Segoe UI", 12, FontStyle.Bold), BackColor = Color.FromArgb(234, 88, 12), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(x, y), Size = new Size(width, 40), Cursor = Cursors.Hand };
            btn.FlatAppearance.BorderSize = 0;
            parent.Controls.Add(btn);
            return btn;
        }

        private DataGridView CreateLightGrid()
        {
            DataGridView dgv = new DataGridView
            {
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
                BackgroundColor = Color.White,
                BorderStyle = BorderStyle.None,
                CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal,
                ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None,
                EnableHeadersVisualStyles = false,
                AllowUserToAddRows = false,
                ReadOnly = true,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                RowHeadersVisible = false
            };
            dgv.DefaultCellStyle.BackColor = Color.White;
            dgv.DefaultCellStyle.ForeColor = Color.Black;
            dgv.DefaultCellStyle.SelectionBackColor = Color.FromArgb(243, 244, 246);
            dgv.DefaultCellStyle.SelectionForeColor = Color.Black;
            dgv.DefaultCellStyle.Font = new Font("Segoe UI", 11);
            dgv.DefaultCellStyle.Padding = new Padding(10, 5, 10, 5);
            
            dgv.ColumnHeadersDefaultCellStyle.BackColor = Color.White;
            dgv.ColumnHeadersDefaultCellStyle.ForeColor = Color.FromArgb(11, 17, 30);
            dgv.ColumnHeadersDefaultCellStyle.SelectionBackColor = Color.White;
            dgv.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            dgv.ColumnHeadersDefaultCellStyle.Padding = new Padding(10);
            dgv.ColumnHeadersHeight = 45;
            dgv.RowTemplate.Height = 45;
            dgv.GridColor = Color.FromArgb(229, 231, 235);
            return dgv;
        }

        private void SafeClearContent()
        {
            foreach (Control c in contentPanel.Controls) { c.Dispose(); }
            contentPanel.Controls.Clear();
        }

        private string ShowInputBox(string text, string caption, string defaultValue = "")
        {
            Form prompt = new Form() { Width = 300, Height = 180, FormBorderStyle = FormBorderStyle.FixedDialog, Text = caption, StartPosition = FormStartPosition.CenterScreen, MinimizeBox = false, MaximizeBox = false };
            Label textLabel = new Label() { Left = 20, Top = 20, Text = text, AutoSize = true };
            TextBox textBox = new TextBox() { Left = 20, Top = 50, Width = 240, Text = defaultValue };
            Button confirmation = new Button() { Text = "Ok", Left = 160, Width = 100, Top = 90, DialogResult = DialogResult.OK, BackColor = Color.FromArgb(234, 88, 12), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            confirmation.FlatAppearance.BorderSize = 0;
            prompt.Controls.Add(textLabel); prompt.Controls.Add(textBox); prompt.Controls.Add(confirmation);
            prompt.AcceptButton = confirmation;
            return prompt.ShowDialog() == DialogResult.OK ? textBox.Text : null;
        }

        // --- VIEWS ---

        private void ShowOrders()
        {
            SetActiveButton(btnOrders);
            SafeClearContent();
            
            TableLayoutPanel tlp = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 60F));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40F));
            contentPanel.Controls.Add(tlp);

            Panel pnlLeft = CreateCardPanel("Create order");
            pnlLeft.Dock = DockStyle.Fill; pnlLeft.Margin = new Padding(0, 0, 15, 0);
            Panel pnlRight = CreateCardPanel("Current order");
            pnlRight.Dock = DockStyle.Fill; pnlRight.Margin = new Padding(15, 0, 0, 0);

            tlp.Controls.Add(pnlLeft, 0, 0); tlp.Controls.Add(pnlRight, 1, 0);

            // Left
            TextBox txtSearch = CreateInput("Search menu...", 20, 60, 200, pnlLeft);
            txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            FlowLayoutPanel flowItems = new FlowLayoutPanel { Location = new Point(20, 100), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom, AutoScroll = true };
            pnlLeft.Controls.Add(flowItems);
            flowItems.Width = pnlLeft.Width - 40; flowItems.Height = pnlLeft.Height - 120;

            try {
                var menuItems = DatabaseHelper.GetMenuItems();
                foreach(var item in menuItems) {
                    Panel itemCard = new Panel { Width = 200, Height = 80, BorderStyle = BorderStyle.FixedSingle, BackColor = Color.White, Margin = new Padding(10), Cursor = Cursors.Hand };
                    Label lblName = new Label { Text = item.name, Font = new Font("Segoe UI", 12, FontStyle.Bold), Location = new Point(10, 10), AutoSize = true, Enabled = false };
                    Label lblPrice = new Label { Text = "Rs " + item.PriceRs.ToString("0.00"), ForeColor = Color.FromArgb(234, 88, 12), Font = new Font("Segoe UI", 10), Location = new Point(10, 40), AutoSize = true, Enabled = false };
                    itemCard.Controls.Add(lblName); itemCard.Controls.Add(lblPrice);
                    
                    itemCard.Click += (s, e) => {
                        var existing = _currentCart.FirstOrDefault(x => x.menu_item_id == item.id);
                        if (existing != null) { existing.quantity++; existing.line_total_paisa += item.price_paisa; }
                        else { _currentCart.Add(new OrderLine { menu_item_id = item.id, item_name = item.name, quantity = 1, unit_price_paisa = item.price_paisa, line_total_paisa = item.price_paisa }); }
                        ShowOrders(); // Re-render to show updated cart
                    };

                    flowItems.Controls.Add(itemCard);
                }
            } catch { }

            // Right
            DataGridView dgvCart = CreateLightGrid();
            dgvCart.Location = new Point(20, 60);
            dgvCart.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            pnlRight.Controls.Add(dgvCart);

            Panel bottomRightPanel = new Panel { Height = 220, Dock = DockStyle.Bottom };
            pnlRight.Controls.Add(bottomRightPanel);
            
            dgvCart.Height = pnlRight.Height - bottomRightPanel.Height - 80;
            dgvCart.Width = pnlRight.Width - 40;

            dgvCart.Columns.Add("name", "Item Name");
            dgvCart.Columns.Add("qty", "Qty");
            dgvCart.Columns.Add("total", "Total");

            double totalRs = 0;
            foreach(var line in _currentCart) {
                double lineTotal = line.line_total_paisa / 100.0;
                totalRs += lineTotal;
                dgvCart.Rows.Add(line.item_name, line.quantity, "Rs " + lineTotal.ToString("0.00"));
            }

            Label lblLine = new Label { BorderStyle = BorderStyle.Fixed3D, Height = 2, Location = new Point(20, 10), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            bottomRightPanel.Controls.Add(lblLine); lblLine.Width = bottomRightPanel.Width - 40;

            Label lblTotalText = new Label { Text = "Total", Font = new Font("Segoe UI", 14, FontStyle.Bold), AutoSize = true, Location = new Point(20, 30), Anchor = AnchorStyles.Top | AnchorStyles.Left };
            Label lblTotalVal = new Label { Text = "Rs " + totalRs.ToString("0.00"), Font = new Font("Segoe UI", 14, FontStyle.Bold), AutoSize = true, Location = new Point(bottomRightPanel.Width - 100, 30), Anchor = AnchorStyles.Top | AnchorStyles.Right };
            bottomRightPanel.Controls.Add(lblTotalText); bottomRightPanel.Controls.Add(lblTotalVal);

            CreateLabel("Customer Name (Optional)", 20, 80, bottomRightPanel).Anchor = AnchorStyles.Top | AnchorStyles.Left;
            TextBox txtCustName = CreateInput("e.g. Hassan Ali", 20, 100, (bottomRightPanel.Width / 2) - 30, bottomRightPanel);
            txtCustName.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            CreateLabel("Phone Number (Optional)", (bottomRightPanel.Width / 2) + 10, 80, bottomRightPanel).Anchor = AnchorStyles.Top | AnchorStyles.Right;
            TextBox txtPhone = CreateInput("e.g. 0300...", (bottomRightPanel.Width / 2) + 10, 100, (bottomRightPanel.Width / 2) - 30, bottomRightPanel);
            txtPhone.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            Label lblPaid = new Label { Text = "Paid Amount", Font = new Font("Segoe UI", 10, FontStyle.Bold), AutoSize = true, Location = new Point(20, 155), Anchor = AnchorStyles.Top | AnchorStyles.Left };
            TextBox txtPaid = new TextBox { Text = totalRs > 0 ? totalRs.ToString("0.00") : "0.00", TextAlign = HorizontalAlignment.Right, Font = new Font("Segoe UI", 11), Location = new Point(bottomRightPanel.Width - 120, 150), Width = 100, Anchor = AnchorStyles.Top | AnchorStyles.Right };
            bottomRightPanel.Controls.Add(lblPaid); bottomRightPanel.Controls.Add(txtPaid);

            Button btnCheckout = new Button { Text = "Save order and view receipt", Font = new Font("Segoe UI", 12, FontStyle.Bold), BackColor = Color.FromArgb(243, 166, 131), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Height = 50, Location = new Point(20, 200), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right, Cursor = Cursors.Hand };
            btnCheckout.FlatAppearance.BorderSize = 0; btnCheckout.Width = bottomRightPanel.Width - 40;
            bottomRightPanel.Controls.Add(btnCheckout); bottomRightPanel.Height = 270;

            btnCheckout.Click += (s, e) => {
                if (_currentCart.Count == 0) { MessageBox.Show("Cart is empty."); return; }
                double paid = 0;
                double.TryParse(txtPaid.Text, out paid);
                string cName = txtCustName.Text == "e.g. Hassan Ali" ? "" : txtCustName.Text;
                string cPhone = txtPhone.Text == "e.g. 0300..." ? "" : txtPhone.Text;
                try {
                    DatabaseHelper.CreateOrder(totalRs, paid, cName, cPhone, _currentCart);
                    MessageBox.Show("Order saved successfully!");
                    _currentCart.Clear();
                    ShowOrders();
                } catch (Exception ex) { MessageBox.Show("Error: " + ex.Message); }
            };
        }

        private void ShowInventory()
        {
            SetActiveButton(btnInventory);
            SafeClearContent();
            
            TableLayoutPanel tlp = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 350F));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            contentPanel.Controls.Add(tlp);

            Panel pnlLeft = CreateCardPanel("Add New Item");
            pnlLeft.Dock = DockStyle.Fill; pnlLeft.Margin = new Padding(0, 0, 15, 0);

            Panel pnlRight = CreateCardPanel("Inventory List");
            pnlRight.Dock = DockStyle.Fill; pnlRight.Margin = new Padding(15, 0, 0, 0);

            tlp.Controls.Add(pnlLeft, 0, 0); tlp.Controls.Add(pnlRight, 1, 0);

            // Left
            CreateLabel("Name", 20, 60, pnlLeft); TextBox txtName = CreateInput("e.g. Flour", 20, 80, 310, pnlLeft); txtName.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            CreateLabel("Category", 20, 130, pnlLeft); TextBox txtCat = CreateInput("e.g. Ingredients", 20, 150, 310, pnlLeft); txtCat.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            CreateLabel("Unit", 20, 200, pnlLeft); TextBox txtUnit = CreateInput("e.g. kg", 20, 220, 145, pnlLeft);
            CreateLabel("Unit Cost (Rs)", 175, 200, pnlLeft); TextBox txtCost = CreateInput("0.00", 175, 220, 155, pnlLeft); txtCost.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            CreateLabel("Initial Stock", 20, 270, pnlLeft); TextBox txtStock = CreateInput("0", 20, 290, 310, pnlLeft); txtStock.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            
            Button btnAdd = CreateOrangeButton("Add item", 20, 350, 120, pnlLeft);
            btnAdd.Click += (s, e) => {
                try {
                    string n = txtName.Text; string c = txtCat.Text; string u = txtUnit.Text;
                    if (n.StartsWith("e.g.")) n = ""; if (c.StartsWith("e.g.")) c = ""; if (u.StartsWith("e.g.")) u = "";
                    double cost = 0, stock = 0;
                    double.TryParse(txtCost.Text, out cost); double.TryParse(txtStock.Text, out stock);
                    DatabaseHelper.CreateItem(n, c, u, cost, stock);
                    ShowInventory();
                } catch (Exception ex) { MessageBox.Show("Error: " + ex.Message); }
            };

            // Right
            TextBox txtSearch = CreateInput("Search items...", 20, 20, 230, pnlRight);
            txtSearch.Location = new Point(pnlRight.Width - 250, 20); txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            DataGridView dgv = CreateLightGrid();
            dgv.Location = new Point(20, 70); dgv.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            pnlRight.Controls.Add(dgv); dgv.Width = pnlRight.Width - 40; dgv.Height = pnlRight.Height - 90;
            
            dgv.Columns.Add("id", "ID"); dgv.Columns["id"].Visible = false;
            dgv.Columns.Add("name", "Name"); dgv.Columns.Add("category", "Category");
            dgv.Columns.Add("stock", "Stock"); dgv.Columns["stock"].DefaultCellStyle.ForeColor = Color.FromArgb(234, 88, 12);
            dgv.Columns.Add("cost", "Unit Cost");

            DataGridViewButtonColumn btnAddCol = new DataGridViewButtonColumn { Text = "Add Stock", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            DataGridViewButtonColumn btnDelCol = new DataGridViewButtonColumn { Text = "Delete", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            dgv.Columns.Add(btnAddCol); dgv.Columns.Add(btnDelCol);

            try {
                var items = DatabaseHelper.GetItems();
                foreach(var item in items) dgv.Rows.Add(item.id, item.name, item.category, item.StockString, "Rs " + item.PriceRs.ToString("0.00"));
            } catch { }

            dgv.CellClick += (s, e) => {
                if (e.RowIndex >= 0) {
                    int id = Convert.ToInt32(dgv.Rows[e.RowIndex].Cells["id"].Value);
                    if (dgv.Columns[e.ColumnIndex] == btnAddCol) {
                        string val = ShowInputBox("Enter amount to add:", "Add Stock", "0");
                        if (double.TryParse(val, out double amt) && amt > 0) { DatabaseHelper.AddStock(id, amt); ShowInventory(); }
                    } else if (dgv.Columns[e.ColumnIndex] == btnDelCol) {
                        if (MessageBox.Show("Delete item?", "Confirm", MessageBoxButtons.YesNo) == DialogResult.Yes) { DatabaseHelper.DeleteItem(id); ShowInventory(); }
                    }
                }
            };
        }

        private void ShowMenu()
        {
            SetActiveButton(btnMenu);
            SafeClearContent();

            TableLayoutPanel tlp = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2 };
            tlp.RowStyles.Add(new RowStyle(SizeType.Absolute, 180F));
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            contentPanel.Controls.Add(tlp);

            Panel pnlTop = CreateCardPanel("Add menu item"); pnlTop.Dock = DockStyle.Fill; pnlTop.Margin = new Padding(0, 0, 0, 15);
            Panel pnlBottom = CreateCardPanel("Menu Items"); pnlBottom.Dock = DockStyle.Fill; pnlBottom.Margin = new Padding(0, 15, 0, 0);

            tlp.Controls.Add(pnlTop, 0, 0); tlp.Controls.Add(pnlBottom, 0, 1);

            // Top
            CreateLabel("Name", 20, 60, pnlTop); TextBox txtName = CreateInput("e.g. Large BBQ Pizza", 20, 80, 200, pnlTop); txtName.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            CreateLabel("Price (Rs)", pnlTop.Width / 2, 60, pnlTop).Anchor = AnchorStyles.Top | AnchorStyles.Right; TextBox txtPrice = CreateInput("0.00", pnlTop.Width / 2, 80, (pnlTop.Width / 2) - 40, pnlTop); txtPrice.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            Button btnAdd = CreateOrangeButton("Add item", 20, 130, 120, pnlTop);
            btnAdd.Click += (s, e) => {
                string n = txtName.Text.StartsWith("e.g.") ? "" : txtName.Text;
                if (double.TryParse(txtPrice.Text, out double price)) {
                    try { DatabaseHelper.CreateMenuItem(n, price); ShowMenu(); }
                    catch (Exception ex) { MessageBox.Show("Error: " + ex.Message); }
                }
            };

            // Bottom
            TextBox txtSearch = CreateInput("Search items...", 20, 20, 230, pnlBottom);
            txtSearch.Location = new Point(pnlBottom.Width - 250, 20); txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            FlowLayoutPanel flowItems = new FlowLayoutPanel { Location = new Point(20, 70), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom, AutoScroll = true };
            pnlBottom.Controls.Add(flowItems); flowItems.Width = pnlBottom.Width - 40; flowItems.Height = pnlBottom.Height - 90;

            try {
                var items = DatabaseHelper.GetMenuItems();
                foreach(var item in items) {
                    Panel itemCard = new Panel { Width = 280, Height = 120, BorderStyle = BorderStyle.FixedSingle, BackColor = Color.White, Margin = new Padding(10) };
                    Label lblName = new Label { Text = item.name, Font = new Font("Segoe UI", 12, FontStyle.Bold), Location = new Point(10, 10), AutoSize = true };
                    Label lblPrice = new Label { Text = "Rs " + item.PriceRs.ToString("0.00"), ForeColor = Color.FromArgb(234, 88, 12), Font = new Font("Segoe UI", 12, FontStyle.Bold), Location = new Point(10, 40), AutoSize = true };
                    itemCard.Controls.Add(lblName); itemCard.Controls.Add(lblPrice);

                    Button btnEdit = new Button { Text = "Edit", FlatStyle = FlatStyle.Flat, Size = new Size(100, 35), Location = new Point(10, 75) };
                    btnEdit.Click += (s, e) => {
                        string val = ShowInputBox("Enter new price:", "Edit " + item.name, item.PriceRs.ToString("0.00"));
                        if (double.TryParse(val, out double np)) { DatabaseHelper.UpdateMenuItem(item.id, np); ShowMenu(); }
                    };

                    Button btnDel = new Button { Text = "Delete", FlatStyle = FlatStyle.Flat, ForeColor = Color.Red, Size = new Size(100, 35), Location = new Point(120, 75) };
                    btnDel.Click += (s, e) => {
                        if (MessageBox.Show("Delete " + item.name + "?", "Confirm", MessageBoxButtons.YesNo) == DialogResult.Yes) { DatabaseHelper.DeleteMenuItem(item.id); ShowMenu(); }
                    };

                    itemCard.Controls.Add(btnEdit); itemCard.Controls.Add(btnDel);
                    flowItems.Controls.Add(itemCard);
                }
            } catch { }
        }

        private void ShowOrdersHistory()
        {
            SetActiveButton(btnOrdersHistory);
            SafeClearContent();
            
            Panel pnl = CreateCardPanel("Recent orders"); pnl.Dock = DockStyle.Fill; contentPanel.Controls.Add(pnl);

            DataGridView dgv = CreateLightGrid(); dgv.Location = new Point(20, 70); dgv.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom; dgv.ColumnHeadersVisible = false; pnl.Controls.Add(dgv); dgv.Width = pnl.Width - 40; dgv.Height = pnl.Height - 90;

            dgv.Columns.Add("id", "ID"); dgv.Columns["id"].Visible = false;
            dgv.Columns.Add("desc", "Description");
            dgv.Columns.Add("price", "Price"); dgv.Columns["price"].DefaultCellStyle.Font = new Font("Segoe UI", 12, FontStyle.Bold); dgv.Columns["price"].DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleRight;

            DataGridViewButtonColumn btnReceipt = new DataGridViewButtonColumn { Text = "Receipt", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            DataGridViewButtonColumn btnDel = new DataGridViewButtonColumn { Text = "Delete", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            dgv.Columns.Add(btnReceipt); dgv.Columns.Add(btnDel);

            try {
                var orders = DatabaseHelper.GetOrders();
                foreach(var o in orders) dgv.Rows.Add(o.id, $"#{o.id} - {o.FormattedDate} - {o.customer_name}", "Rs " + o.TotalRs.ToString("0.00"));
            } catch { }

            dgv.CellClick += (s, e) => {
                if (e.RowIndex >= 0 && dgv.Columns[e.ColumnIndex] == btnDel) {
                    int id = Convert.ToInt32(dgv.Rows[e.RowIndex].Cells["id"].Value);
                    if (MessageBox.Show("Delete order?", "Confirm", MessageBoxButtons.YesNo) == DialogResult.Yes) { DatabaseHelper.DeleteOrder(id); ShowOrdersHistory(); }
                } else if (e.RowIndex >= 0 && dgv.Columns[e.ColumnIndex] == btnReceipt) {
                    MessageBox.Show("Receipt printing not yet implemented.");
                }
            };
        }

        private void ShowReports()
        {
            SetActiveButton(btnReports);
            SafeClearContent();
            
            TableLayoutPanel tlpMain = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2 };
            tlpMain.RowStyles.Add(new RowStyle(SizeType.Absolute, 50F)); tlpMain.RowStyles.Add(new RowStyle(SizeType.Percent, 100F)); contentPanel.Controls.Add(tlpMain);

            Panel pnlTop = new Panel { Dock = DockStyle.Fill }; tlpMain.Controls.Add(pnlTop, 0, 0);

            TextBox txtSearch = CreateInput("Search by date...", pnlTop.Width - 300, 10, 150, pnlTop); txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            ComboBox cmbView = new ComboBox { Font = new Font("Segoe UI", 11), Location = new Point(pnlTop.Width - 130, 10), Width = 100, Anchor = AnchorStyles.Top | AnchorStyles.Right, DropDownStyle = ComboBoxStyle.DropDownList };
            cmbView.Items.AddRange(new string[] { "Daily View", "Weekly View", "Monthly View" }); cmbView.SelectedIndex = 0; pnlTop.Controls.Add(cmbView);

            TableLayoutPanel tlpCards = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            tlpCards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F)); tlpCards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F)); tlpMain.Controls.Add(tlpCards, 0, 1);

            Panel pnlLeft = CreateCardPanel("Sales Report"); pnlLeft.Dock = DockStyle.Fill; pnlLeft.Margin = new Padding(0, 0, 15, 0);
            Panel pnlRight = CreateCardPanel("Purchase Report"); pnlRight.Dock = DockStyle.Fill; pnlRight.Margin = new Padding(15, 0, 0, 0);

            tlpCards.Controls.Add(pnlLeft, 0, 0); tlpCards.Controls.Add(pnlRight, 1, 0);
            pnlLeft.Controls[0].ForeColor = Color.FromArgb(234, 88, 12); pnlRight.Controls[0].ForeColor = Color.FromArgb(100, 149, 237);

            DataGridView dgvSales = CreateLightGrid(); dgvSales.Location = new Point(20, 60); dgvSales.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom; pnlLeft.Controls.Add(dgvSales); dgvSales.Width = pnlLeft.Width - 40; dgvSales.Height = pnlLeft.Height - 80;
            dgvSales.Columns.Add("date", "Date"); dgvSales.Columns.Add("orders", "Orders"); dgvSales.Columns.Add("rev", "Revenue"); dgvSales.Columns["rev"].DefaultCellStyle.ForeColor = Color.FromArgb(34, 197, 94);
            
            try {
                var sales = DatabaseHelper.GetSalesReport();
                foreach(var s in sales) { dgvSales.Rows.Add(s.date, s.order_count, "Rs " + (s.total_sales / 100.0).ToString("0.00")); }
            } catch { }

            DataGridView dgvPurch = CreateLightGrid(); dgvPurch.Location = new Point(20, 60); dgvPurch.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom; pnlRight.Controls.Add(dgvPurch); dgvPurch.Width = pnlRight.Width - 40; dgvPurch.Height = pnlRight.Height - 80;
            dgvPurch.Columns.Add("date", "Date"); dgvPurch.Columns.Add("purch", "Purchases"); dgvPurch.Columns.Add("cost", "Cost"); dgvPurch.Columns["cost"].DefaultCellStyle.ForeColor = Color.FromArgb(239, 68, 68);
            
            try {
                var purchases = DatabaseHelper.GetPurchaseReport();
                foreach(var p in purchases) { dgvPurch.Rows.Add(p.date, p.movement_count, "Rs " + (p.total_cost / 100.0).ToString("0.00")); }
            } catch { }
        }

        private void ShowSettings()
        {
            SetActiveButton(btnSettings);
            SafeClearContent();
            
            Panel pnl = CreateCardPanel("App Settings"); pnl.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; pnl.Location = new Point(0, 0); pnl.Width = contentPanel.Width; pnl.Height = 600; contentPanel.Controls.Add(pnl);

            Button btnPwd = new Button { Text = "Change Password", BackColor = Color.FromArgb(55, 65, 81), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(pnl.Width - 180, 20), Size = new Size(160, 35), Anchor = AnchorStyles.Top | AnchorStyles.Right };
            pnl.Controls.Add(btnPwd);

            var s = DatabaseHelper.GetSettings();
            string rn = s.ContainsKey("restaurant_name") ? s["restaurant_name"] : "Snack City";
            string cn = s.ContainsKey("contact") ? s["contact"] : "";
            string ad = s.ContainsKey("address") ? s["address"] : "";
            string em = s.ContainsKey("email") ? s["email"] : "";
            string wb = s.ContainsKey("website") ? s["website"] : "";

            int y = 70;
            CreateLabel("Restaurant Name", 20, y, pnl); TextBox t1 = CreateInput("Snack City", 20, y+20, pnl.Width - 40, pnl); t1.Text = rn; t1.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Contact", 20, y, pnl); TextBox t2 = CreateInput("03224122066", 20, y+20, pnl.Width - 40, pnl); t2.Text = cn; t2.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Address", 20, y, pnl); TextBox t3 = CreateInput("Walton", 20, y+20, pnl.Width - 40, pnl); t3.Text = ad; t3.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Email (Optional)", 20, y, pnl); TextBox t4 = CreateInput("", 20, y+20, pnl.Width - 40, pnl); t4.Text = em; t4.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Website (Optional)", 20, y, pnl); TextBox t5 = CreateInput("", 20, y+20, pnl.Width - 40, pnl); t5.Text = wb; t5.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            
            CreateLabel("Receipt Size", 20, y, pnl); 
            ComboBox cmbReceipt = new ComboBox { Font = new Font("Segoe UI", 11), Location = new Point(20, y+20), Width = (pnl.Width/2) - 30 };
            cmbReceipt.Items.AddRange(new string[] { "80mm", "58mm" }); cmbReceipt.SelectedIndex = 0; pnl.Controls.Add(cmbReceipt);

            CreateLabel("App Theme", (pnl.Width/2) + 10, y, pnl);
            ComboBox cmbTheme = new ComboBox { Font = new Font("Segoe UI", 11), Location = new Point((pnl.Width/2) + 10, y+20), Width = (pnl.Width/2) - 30 };
            cmbTheme.Items.AddRange(new string[] { "Light", "Dark" }); cmbTheme.SelectedIndex = 0; pnl.Controls.Add(cmbTheme);
            
            y += 70;
            Button btnSave = CreateOrangeButton("Save Settings", 20, y, 150, pnl);
            btnSave.Click += (sender, e) => {
                try {
                    DatabaseHelper.SaveSetting("restaurant_name", t1.Text);
                    DatabaseHelper.SaveSetting("contact", t2.Text);
                    DatabaseHelper.SaveSetting("address", t3.Text);
                    DatabaseHelper.SaveSetting("email", t4.Text);
                    DatabaseHelper.SaveSetting("website", t5.Text);
                    MessageBox.Show("Settings saved!");
                } catch (Exception ex) { MessageBox.Show("Error: " + ex.Message); }
            };
        }

        private void BtnLogout_Click(object sender, EventArgs e)
        {
            var result = MessageBox.Show("Are you sure you want to log out?", "Confirm", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes) { Program.OpenLoginForm(); this.Close(); }
        }
        
        protected override void OnFormClosed(FormClosedEventArgs e) { base.OnFormClosed(e); if (Application.OpenForms.Count == 0) Application.Exit(); }
    }
}
