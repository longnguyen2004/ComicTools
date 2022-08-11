using System;
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
using System.Windows.Shapes;

namespace Raw_Splitter___Merger.Merger
{
    /// <summary>
    /// Interaction logic for MergerWorkerWindow.xaml
    /// </summary>
    public partial class MergerWorkerWindow : Window
    {
        public MergerWorkerWindow(MergerWorker worker)
        {
            InitializeComponent();
            this.DataContext = worker;
        }
    }
}
