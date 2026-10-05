using System;
using System.Drawing;
using System.Windows.Forms;
using System.Linq;
using System.Collections.Generic;
using Dapper;

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
            
            if (_currentUser.role == "staff")
            {
                btnInventory.Visible = false;
                btnMenu.Visible = false;
                btnReports.Visible = false;
                btnSettings.Visible = false;
                btnOrdersHistory.Visible = false;
            }

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
            DataGridViewButtonColumn btnDelCol = new DataGridViewButtonColumn { Text = "✖ Delete", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            dgv.Columns.Add(btnAddCol); dgv.Columns.Add(btnDelCol);

            Action filterInv = () => {
                dgv.Rows.Clear();
                try {
                    var items = DatabaseHelper.GetItems();
                    if (txtSearch.Text != "Search items..." && txtSearch.Text != "") 
                        items = items.Where(x => x.name.ToLower().Contains(txtSearch.Text.ToLower())).ToList();
                    foreach(var item in items) dgv.Rows.Add(item.id, item.name, item.category, item.StockString, "Rs " + item.PriceRs.ToString("0.00"));
                } catch { }
            };
            filterInv();
            txtSearch.TextChanged += (s, e) => filterInv();

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
            tlp.RowStyles.Add(new RowStyle(SizeType.Absolute, 220F)); 
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            contentPanel.Controls.Add(tlp);

            Panel pnlTop = CreateCardPanel("Add menu item"); pnlTop.Dock = DockStyle.Fill; pnlTop.Margin = new Padding(0, 0, 0, 15);
            Panel pnlBottom = CreateCardPanel("Menu Items"); pnlBottom.Dock = DockStyle.Fill; pnlBottom.Margin = new Padding(0, 15, 0, 0);

            tlp.Controls.Add(pnlTop, 0, 0); tlp.Controls.Add(pnlBottom, 0, 1);

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

            TextBox txtSearch = CreateInput("Search menu...", 20, 20, 230, pnlBottom);
            txtSearch.Location = new Point(pnlBottom.Width - 250, 20); txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            DataGridView dgv = CreateLightGrid();
            dgv.Location = new Point(20, 70); dgv.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            pnlBottom.Controls.Add(dgv); dgv.Width = pnlBottom.Width - 40; dgv.Height = pnlBottom.Height - 90;
            
            dgv.Columns.Add("id", "ID"); dgv.Columns["id"].Visible = false;
            dgv.Columns.Add("name", "Name");
            dgv.Columns.Add("price", "Price");

            DataGridViewButtonColumn btnEditCol = new DataGridViewButtonColumn { Text = "✏️ Edit", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            DataGridViewButtonColumn btnDelCol = new DataGridViewButtonColumn { Text = "✖ Delete", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
            dgv.Columns.Add(btnEditCol); dgv.Columns.Add(btnDelCol);

            Action filterMenu = () => {
                dgv.Rows.Clear();
                try {
                    var items = DatabaseHelper.GetMenuItems();
                    if (txtSearch.Text != "Search menu..." && txtSearch.Text != "")
                        items = items.Where(x => x.name.ToLower().Contains(txtSearch.Text.ToLower())).ToList();
                    foreach(var item in items) dgv.Rows.Add(item.id, item.name, "Rs " + item.PriceRs.ToString("0.00"));
                } catch { }
            };
            filterMenu();
            txtSearch.TextChanged += (s, e) => filterMenu();

            dgv.CellClick += (s, e) => {
                if (e.RowIndex >= 0) {
                    int id = Convert.ToInt32(dgv.Rows[e.RowIndex].Cells["id"].Value);
                    if (dgv.Columns[e.ColumnIndex] == btnDelCol) {
                        if (MessageBox.Show("Delete menu item?", "Confirm", MessageBoxButtons.YesNo) == DialogResult.Yes) { DatabaseHelper.DeleteMenuItem(id); ShowMenu(); }
                    } else if (dgv.Columns[e.ColumnIndex] == btnEditCol) {
                        string oldName = dgv.Rows[e.RowIndex].Cells["name"].Value.ToString();
                        string oldPriceStr = dgv.Rows[e.RowIndex].Cells["price"].Value.ToString().Replace("Rs ", "");
                        
                        string newName = ShowInputBox("Enter new name:", "Edit Menu Item", oldName);
                        if (!string.IsNullOrEmpty(newName)) {
                            string newPrice = ShowInputBox("Enter new price (Rs):", "Edit Menu Item", oldPriceStr);
                            if (double.TryParse(newPrice, out double p)) {
                                DatabaseHelper.UpdateMenuItem(id, newName, p);
                                ShowMenu();
                            }
                        }
                    }
                }
            };
        }

        private void ShowOrders()
        {
            SetActiveButton(btnOrders);
            SafeClearContent();

            TableLayoutPanel tlp = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 55F));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 45F));
            contentPanel.Controls.Add(tlp);

            Panel pnlLeft = CreateCardPanel("Create order");
            pnlLeft.Dock = DockStyle.Fill; pnlLeft.Margin = new Padding(0, 0, 15, 0);
            Panel pnlRight = CreateCardPanel("Current order");
            pnlRight.Dock = DockStyle.Fill; pnlRight.Margin = new Padding(15, 0, 0, 0);

            tlp.Controls.Add(pnlLeft, 0, 0); tlp.Controls.Add(pnlRight, 1, 0);

            TextBox txtSearch = CreateInput("Search menu...", 20, 60, 200, pnlLeft);
            txtSearch.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            FlowLayoutPanel flowItems = new FlowLayoutPanel { Location = new Point(20, 100), Width = pnlLeft.Width - 40, Height = pnlLeft.Height - 120, Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom, AutoScroll = true };
            pnlLeft.Controls.Add(flowItems);
            
            DataGridView dgvCart = CreateLightGrid();
            dgvCart.Location = new Point(20, 70); dgvCart.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            pnlRight.Controls.Add(dgvCart); dgvCart.Width = pnlRight.Width - 40; dgvCart.Height = pnlRight.Height - 260; // Extra room for bottom inputs

            dgvCart.Columns.Add("id", "ID"); dgvCart.Columns["id"].Visible = false;
            dgvCart.Columns.Add("name", "Item");
            dgvCart.Columns.Add("qty", "Qty");
            dgvCart.Columns.Add("price", "Price");
            DataGridViewButtonColumn btnDec = new DataGridViewButtonColumn { Text = "➖", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, Width = 35 };
            DataGridViewButtonColumn btnRem = new DataGridViewButtonColumn { Text = "✖", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, Width = 35 };
            dgvCart.Columns.Add(btnDec); dgvCart.Columns.Add(btnRem);
            
            Label lblTotal = new Label { Text = "Total: Rs 0.00", Font = new Font("Segoe UI", 16, FontStyle.Bold), ForeColor = Color.FromArgb(234, 88, 12), AutoSize = true, Anchor = AnchorStyles.Bottom | AnchorStyles.Left };
            pnlRight.Controls.Add(lblTotal); lblTotal.Location = new Point(20, pnlRight.Height - 240);
            
            CreateLabel("Paid Amount", 20, pnlRight.Height - 190, pnlRight).Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            TextBox txtPaid = CreateInput("0.00", 120, pnlRight.Height - 193, pnlRight.ClientSize.Width - 140, pnlRight); 
            txtPaid.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;

            CreateLabel("Customer", 20, pnlRight.Height - 140, pnlRight).Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            TextBox txtCustomer = CreateInput("", 100, pnlRight.Height - 143, pnlRight.ClientSize.Width - 120, pnlRight); 
            txtCustomer.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            
            CreateLabel("Phone", 20, pnlRight.Height - 90, pnlRight).Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            TextBox txtPhone = CreateInput("", 100, pnlRight.Height - 93, pnlRight.ClientSize.Width - 120, pnlRight); 
            txtPhone.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;

            Button btnCheckout = CreateOrangeButton("Checkout", 20, pnlRight.Height - 50, pnlRight.Width - 40, pnlRight);
            btnCheckout.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;


            Action UpdateCartTotal = () => {
                double total = 0;
                foreach (DataGridViewRow r in dgvCart.Rows) {
                    total += Convert.ToDouble(r.Cells["price"].Value) * Convert.ToInt32(r.Cells["qty"].Value);
                }
                lblTotal.Text = $"Total: Rs {total:0.00}";
            };
            
            dgvCart.CellClick += (s, e) => {
                if (e.RowIndex >= 0) {
                    if (e.ColumnIndex == 4) { // Decrease
                        int qty = Convert.ToInt32(dgvCart.Rows[e.RowIndex].Cells["qty"].Value);
                        if (qty > 1) dgvCart.Rows[e.RowIndex].Cells["qty"].Value = qty - 1;
                        else dgvCart.Rows.RemoveAt(e.RowIndex);
                        UpdateCartTotal();
                    } else if (e.ColumnIndex == 5) { // Remove
                        dgvCart.Rows.RemoveAt(e.RowIndex);
                        UpdateCartTotal();
                    }
                }
            };
            
            Action filterPos = () => {
                flowItems.Controls.Clear();
                try {
                    var items = DatabaseHelper.GetMenuItems();
                    if (txtSearch.Text != "Search menu..." && txtSearch.Text != "")
                        items = items.Where(x => x.name.ToLower().Contains(txtSearch.Text.ToLower())).ToList();
                        
                    foreach(var item in items)
                    {
                        Button btn = new Button { Text = $"{item.name}\nRs {item.PriceRs:0.00}", Tag = item, Width = 150, Height = 80, BackColor = Color.White, FlatStyle = FlatStyle.Flat, Cursor = Cursors.Hand };
                        btn.FlatAppearance.BorderColor = Color.LightGray;
                        btn.Click += (s, e) => {
                            MenuItem m = (MenuItem)((Button)s).Tag;
                            bool found = false;
                            foreach (DataGridViewRow r in dgvCart.Rows) {
                                if (Convert.ToInt32(r.Cells["id"].Value) == m.id) {
                                    r.Cells["qty"].Value = Convert.ToInt32(r.Cells["qty"].Value) + 1;
                                    found = true; break;
                                }
                            }
                            if (!found) dgvCart.Rows.Add(m.id, m.name, 1, m.PriceRs, "-", "X");
                            UpdateCartTotal();
                        };
                        flowItems.Controls.Add(btn);
                    }
                } catch { }
            };
            filterPos();
            txtSearch.TextChanged += (s, e) => filterPos();

            btnCheckout.Click += (s, e) => {
                try {
                    if (dgvCart.Rows.Count == 0) { MessageBox.Show("Cart is empty!"); return; }
                    double total = 0;
                    List<OrderLine> lines = new List<OrderLine>();
                    foreach (DataGridViewRow r in dgvCart.Rows) {
                        int q = Convert.ToInt32(r.Cells["qty"].Value);
                        double p = Convert.ToDouble(r.Cells["price"].Value);
                        total += (p * q);
                        lines.Add(new OrderLine { menu_item_id = Convert.ToInt32(r.Cells["id"].Value), item_name = r.Cells["name"].Value?.ToString() ?? "", quantity = q, unit_price_paisa = (int)(p * 100), line_total_paisa = (int)(p * q * 100) });
                    }
                    double.TryParse(txtPaid.Text, out double paid);
                    if (paid < total) { MessageBox.Show("Paid amount is less than total!"); return; }
                    
                    int id = DatabaseHelper.CreateOrder(total, paid, txtCustomer.Text, txtPhone.Text, lines);
                    MessageBox.Show("Order placed successfully! Order ID: " + id);
                    ShowReceipt(id, true);
                    ShowOrders();
                } catch (Exception ex) { MessageBox.Show("Error: " + ex.Message); }
            };
        }

                private void ShowReceipt(int orderId, bool allowPrint = false)
        {
            try
            {
                new ReceiptForm(orderId, allowPrint).ShowDialog();
            }
            catch (Exception ex) { MessageBox.Show("Error displaying receipt: " + ex.Message); }
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
            DataGridViewButtonColumn btnDel = new DataGridViewButtonColumn { Text = "✖ Delete", UseColumnTextForButtonValue = true, FlatStyle = FlatStyle.Flat, AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells };
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
                    int id = Convert.ToInt32(dgv.Rows[e.RowIndex].Cells["id"].Value);
                    ShowReceipt(id);
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
            cmbView.Items.AddRange(new string[] { "Daily View", "Monthly View", "Yearly View" }); cmbView.SelectedIndex = 0; pnlTop.Controls.Add(cmbView);

            TableLayoutPanel tlpCards = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            tlpCards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F)); tlpCards.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F)); tlpMain.Controls.Add(tlpCards, 0, 1);

            Panel pnlLeft = CreateCardPanel("Sales Report"); pnlLeft.Dock = DockStyle.Fill; pnlLeft.Margin = new Padding(0, 0, 15, 0);
            Panel pnlRight = CreateCardPanel("Purchase Report"); pnlRight.Dock = DockStyle.Fill; pnlRight.Margin = new Padding(15, 0, 0, 0);

            tlpCards.Controls.Add(pnlLeft, 0, 0); tlpCards.Controls.Add(pnlRight, 1, 0);
            pnlLeft.Controls[0].ForeColor = Color.FromArgb(234, 88, 12); pnlRight.Controls[0].ForeColor = Color.FromArgb(100, 149, 237);

            DataGridView dgvSales = CreateLightGrid(); dgvSales.Location = new Point(20, 60); dgvSales.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom; pnlLeft.Controls.Add(dgvSales); dgvSales.Width = pnlLeft.Width - 40; dgvSales.Height = pnlLeft.Height - 80;
            dgvSales.Columns.Add("date", "Date"); dgvSales.Columns.Add("orders", "Orders"); dgvSales.Columns.Add("rev", "Revenue"); dgvSales.Columns["rev"].DefaultCellStyle.ForeColor = Color.FromArgb(34, 197, 94);

            DataGridView dgvPurch = CreateLightGrid(); dgvPurch.Location = new Point(20, 60); dgvPurch.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom; pnlRight.Controls.Add(dgvPurch); dgvPurch.Width = pnlRight.Width - 40; dgvPurch.Height = pnlRight.Height - 80;
            dgvPurch.Columns.Add("date", "Date"); dgvPurch.Columns.Add("purch", "Purchases"); dgvPurch.Columns.Add("cost", "Cost"); dgvPurch.Columns["cost"].DefaultCellStyle.ForeColor = Color.FromArgb(239, 68, 68);

            Action RefreshData = () => {
                dgvSales.Rows.Clear(); dgvPurch.Rows.Clear();
                string period = "daily";
                if (cmbView.SelectedIndex == 1) period = "monthly";
                if (cmbView.SelectedIndex == 2) period = "yearly";
                
                try {
                    var sales = DatabaseHelper.GetSalesReport(period);
                    foreach(var s in sales) { dgvSales.Rows.Add(s.date, s.order_count, "Rs " + (s.total_sales / 100.0).ToString("0.00")); }
                    var purchases = DatabaseHelper.GetPurchaseReport(period);
                    foreach(var p in purchases) { dgvPurch.Rows.Add(p.date, p.movement_count, "Rs " + (p.total_cost / 100.0).ToString("0.00")); }
                } catch { }
            };

            cmbView.SelectedIndexChanged += (s, e) => RefreshData();
            RefreshData();
        }

        private void ShowSettings()
        {
            SetActiveButton(btnSettings);
            SafeClearContent();
            
            Panel pnl = CreateCardPanel("App Settings"); pnl.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; pnl.Location = new Point(0, 0); pnl.Width = contentPanel.Width; pnl.Height = 600; contentPanel.Controls.Add(pnl);

            Button btnPwd = new Button { Text = "Change Password", BackColor = Color.FromArgb(55, 65, 81), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Location = new Point(pnl.Width - 180, 20), Size = new Size(160, 35), Anchor = AnchorStyles.Top | AnchorStyles.Right };
            btnPwd.Click += (sender, e) => {
                string p = ShowInputBox("Enter New Password:", "Change Password", "");
                if (!string.IsNullOrEmpty(p)) { DatabaseHelper.ChangePassword(p); MessageBox.Show("Password updated."); }
            };
            pnl.Controls.Add(btnPwd);

            var s = DatabaseHelper.GetSettings();
            string rn = s.ContainsKey("restaurant_name") ? s["restaurant_name"] : "Snack City";
            string cn = s.ContainsKey("contact") ? s["contact"] : "0300 1234567";
            string ad = s.ContainsKey("address") ? s["address"] : "";
            string em = s.ContainsKey("email") ? s["email"] : "";
            string wb = s.ContainsKey("website") ? s["website"] : "";

            int y = 70;
            CreateLabel("Restaurant Name", 20, y, pnl); TextBox t1 = CreateInput("Snack City", 20, y+20, pnl.Width - 40, pnl); t1.Text = rn; t1.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Contact", 20, y, pnl); TextBox t2 = CreateInput("0300 1234567", 20, y+20, pnl.Width - 40, pnl); t2.Text = cn; t2.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Address", 20, y, pnl); TextBox t3 = CreateInput("Walton", 20, y+20, pnl.Width - 40, pnl); t3.Text = ad; t3.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Email (Optional)", 20, y, pnl); TextBox t4 = CreateInput("", 20, y+20, pnl.Width - 40, pnl); t4.Text = em; t4.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            CreateLabel("Website (Optional)", 20, y, pnl); TextBox t5 = CreateInput("", 20, y+20, pnl.Width - 40, pnl); t5.Text = wb; t5.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right; y += 70;
            
            CreateLabel("Receipt Size", 20, y, pnl); 
            ComboBox cmbReceipt = new ComboBox { Font = new Font("Segoe UI", 11), Location = new Point(20, y+20), Width = (pnl.Width/2) - 30 };
            cmbReceipt.Items.AddRange(new string[] { "80mm", "58mm" }); cmbReceipt.SelectedItem = s.ContainsKey("receipt_size") ? s["receipt_size"] : "80mm"; pnl.Controls.Add(cmbReceipt);

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
                    DatabaseHelper.SaveSetting("website", t5.Text); DatabaseHelper.SaveSetting("receipt_size", cmbReceipt.SelectedItem.ToString());
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
