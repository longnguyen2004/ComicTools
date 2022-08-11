using System;
using System.IO;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Collections.Generic;
using System.Collections.ObjectModel;
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

namespace Raw_Splitter___Merger.Splitter
{
    /// <summary>
    /// Interaction logic for SplitterUI.xaml
    /// </summary>
    public partial class SplitterUI : UserControl, IToolComponent
    {
        #region "Image List Handling"
        ImageList? imageList;
        ImageItem? _currentItem;
        ImageItem? CurrentItem
        {
            get { return _currentItem; }
            set
            {
                _currentItem = value;
                if (_currentItem is not null)
                {
                    Viewer.Path = _currentItem.File.FullName;
                    SplitList.ItemsSource = _currentItem.SplitList;
                }
                else
                {
                    Viewer.Path = null;
                    SplitList.ItemsSource = null;
                }
            }
        }
        public void ChangeDirectory(string path)
        {
            imageList = new(new DirectoryInfo(path).GetFiles().Where(file => Settings.AllowedExtensions.Contains(file.Extension)));
            FileList.ItemsSource = imageList;
        }
        private void OpenImage(object sender, SelectionChangedEventArgs e)
            => CurrentItem = (sender as DataGrid).SelectedItem as ImageItem;
        #endregion

        #region "Split Position"
        private void AddSplitPosition(object sender, Point coord)
        {
            CurrentItem.SplitList.Add((int)coord.Y);
        }
        private void RemoveSplitPosition(object sender, EventArgs e)
        {
            if (SplitList.SelectedIndex != -1)
            {
                var oldIndex = SplitList.SelectedIndex;
                CurrentItem.SplitList.Remove((int)SplitList.SelectedItem);
                SplitList.SelectedIndex = Math.Min(oldIndex, CurrentItem.SplitList.Count - 1);
            }
        }
        private void SplitList_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Delete)
                RemoveSplitPosition(sender, e);
        }
        #endregion

        #region "Processing"
        static readonly SplitterWorker worker = new();
        private void StartProcessing(object sender, RoutedEventArgs e)
        {
            if (imageList is not null)
            {
                var dialog = new VistaFolderBrowserDialog
                {
                    Multiselect = false,
                    ShowNewFolderButton = true
                };
                if (dialog.ShowDialog() ?? false)
                {
                    foreach (var item in imageList)
                        worker.AddToQueue(item, new(dialog.SelectedPath));
                }
            }
            OpenWorkerWindow(sender, e);
        }
        #endregion

        private void OpenWorkerWindow(object sender, RoutedEventArgs e)
        {
            new SplitterWorkerWindow(worker).ShowDialog();
        }

        public SplitterUI()
        {
            InitializeComponent();
        }
    }
}
