using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Ookii.Dialogs.Wpf;

namespace Raw_Splitter___Merger
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>

    public partial class MainWindow : Window
    {
        private void OpenFolder(object sender, RoutedEventArgs e)
        {
            var dialog = new VistaFolderBrowserDialog
            {
                Multiselect = false
            };
            if (dialog.ShowDialog() ?? false)
                (WorkArea.SelectedContent as IToolComponent)?.ChangeDirectory(dialog.SelectedPath);
        }
        public MainWindow()
        {
            InitializeComponent();
            Trace.WriteLine($"Max Image Size: {RenderCapability.MaxHardwareTextureSize}");
        }
    }
}
