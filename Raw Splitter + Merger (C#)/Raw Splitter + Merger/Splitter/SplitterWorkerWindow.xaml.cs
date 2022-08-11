using System;
using System.IO;
using System.Runtime.CompilerServices;
using System.ComponentModel;
using System.Collections.ObjectModel;
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
using ImageMagick;

namespace Raw_Splitter___Merger.Splitter
{
    /// <summary>
    /// Interaction logic for SplitterWorker.xaml
    /// </summary>
    public partial class SplitterWorkerWindow : Window
    {
        public SplitterWorkerWindow(SplitterWorker worker)
        {
            InitializeComponent();
            this.DataContext = worker;
        }
    }
}
