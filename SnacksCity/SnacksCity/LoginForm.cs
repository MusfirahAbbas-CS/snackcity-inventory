using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace SnacksCity
{
    public partial class LoginForm : Form
    {
        private TextBox txtPassword;
        private Button btnLogin;
        private Label lblTitleSmall;
        private Label lblTitleLarge;
        private Panel cardPanel;
        private Panel pwdContainer;
        private Label lblEye;
        private bool isPasswordHidden = true;

        public LoginForm()
        {
            InitializeComponent();
            SetupUI();
        }

        private void SetupUI()
        {
            this.Text = "Snack City - Login";
            this.Size = new Size(1024, 768);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(11, 17, 30); // Darkest background (#0b111e)
            
            try { this.Icon = new Icon(@"..\..\..\..\frontend\public\icon.ico"); } catch { }

            // Card Panel (Rounded appearance)
            cardPanel = new Panel
            {
                Size = new Size(400, 300),
                Location = new Point((this.ClientSize.Width - 400) / 2, (this.ClientSize.Height - 300) / 2),
                BackColor = Color.FromArgb(28, 35, 49), // Inner card background (#1c2331)
                Anchor = AnchorStyles.None
            };
            this.Controls.Add(cardPanel);

            // "POINT OF SALE" text
            lblTitleSmall = new Label
            {
                Text = "POINT OF SALE",
                ForeColor = Color.FromArgb(234, 88, 12),
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                AutoSize = true
            };
            cardPanel.Controls.Add(lblTitleSmall);
            lblTitleSmall.Location = new Point((cardPanel.Width - lblTitleSmall.PreferredWidth) / 2, 40);

            // "Snack City" text
            lblTitleLarge = new Label
            {
                Text = "Snack City",
                ForeColor = Color.White,
                Font = new Font("Segoe UI Black", 24, FontStyle.Bold),
                AutoSize = true
            };
            cardPanel.Controls.Add(lblTitleLarge);
            lblTitleLarge.Location = new Point((cardPanel.Width - lblTitleLarge.PreferredWidth) / 2, 60);

            // Password Container (for orange border)
            pwdContainer = new Panel
            {
                Size = new Size(300, 45),
                Location = new Point((cardPanel.Width - 300) / 2, 130),
                BackColor = Color.FromArgb(15, 23, 42),
                Padding = new Padding(2) // 2px border
            };
            cardPanel.Controls.Add(pwdContainer);

            // The actual inner panel to simulate the border
            Panel pwdInner = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 23, 42)
            };
            pwdContainer.Controls.Add(pwdInner);
            
            // Custom Paint for Orange Border
            pwdContainer.Paint += (s, e) => {
                ControlPaint.DrawBorder(e.Graphics, pwdContainer.ClientRectangle, Color.FromArgb(234, 88, 12), ButtonBorderStyle.Solid);
            };

            // Password Input
            txtPassword = new TextBox
            {
                Text = "Password",
                ForeColor = Color.Gray,
                Font = new Font("Segoe UI", 12),
                BackColor = Color.FromArgb(15, 23, 42),
                BorderStyle = BorderStyle.None,
                Location = new Point(10, 10),
                Width = 240
            };
            
            // Placeholder logic
            txtPassword.Enter += (s, e) => {
                if (txtPassword.Text == "Password") {
                    txtPassword.Text = "";
                    txtPassword.ForeColor = Color.White;
                    txtPassword.UseSystemPasswordChar = isPasswordHidden;
                }
            };
            txtPassword.Leave += (s, e) => {
                if (string.IsNullOrWhiteSpace(txtPassword.Text)) {
                    txtPassword.UseSystemPasswordChar = false;
                    txtPassword.Text = "Password";
                    txtPassword.ForeColor = Color.Gray;
                }
            };
            pwdInner.Controls.Add(txtPassword);

            // Eye Icon
            lblEye = new Label
            {
                Text = "👁",
                ForeColor = Color.Gray,
                Font = new Font("Segoe UI", 12),
                AutoSize = true,
                Location = new Point(265, 10),
                Cursor = Cursors.Hand
            };
            lblEye.Click += (s, e) => {
                isPasswordHidden = !isPasswordHidden;
                if (txtPassword.Text != "Password") {
                    txtPassword.UseSystemPasswordChar = isPasswordHidden;
                }
                lblEye.ForeColor = isPasswordHidden ? Color.Gray : Color.White;
            };
            pwdInner.Controls.Add(lblEye);

            // Login Button
            btnLogin = new Button
            {
                Text = "Login",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                BackColor = Color.FromArgb(234, 88, 12), // Orange
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(300, 45),
                Location = new Point((cardPanel.Width - 300) / 2, 200),
                Cursor = Cursors.Hand
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += BtnLogin_Click;
            cardPanel.Controls.Add(btnLogin);
            
            this.AcceptButton = btnLogin;
            
            // Handle window resize centering
            this.Resize += (s, e) => {
                cardPanel.Location = new Point((this.ClientSize.Width - cardPanel.Width) / 2, (this.ClientSize.Height - cardPanel.Height) / 2);
            };
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            string password = txtPassword.Text;
            if (password == "Password" || string.IsNullOrWhiteSpace(password))
            {
                MessageBox.Show("Please enter a password.", "Notice", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var user = DatabaseHelper.AuthenticateUser(password);
            if (user != null)
            {
                MainForm mainForm = new MainForm(user);
                mainForm.Show();
                this.Hide();
            }
            else
            {
                MessageBox.Show("Invalid password. Please try again.", "Authentication Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtPassword.Text = "Password";
                txtPassword.ForeColor = Color.Gray;
                txtPassword.UseSystemPasswordChar = false;
                this.ActiveControl = null; // Remove focus to show placeholder
            }
        }
    }
}
