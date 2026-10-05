using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SnacksCity
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            OpenLoginForm();
            Application.Run();
        }

        public static void OpenLoginForm()
        {
            LoginForm login = new LoginForm();
            login.FormClosed += (s, args) => {
                if (Application.OpenForms.Count == 0) Application.ExitThread();
            };
            login.Show();
        }
    }
}
