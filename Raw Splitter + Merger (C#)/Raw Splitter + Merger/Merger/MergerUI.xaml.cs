using System;
using System.IO;
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
using Raw_Splitter___Merger.Utility;
using Ookii.Dialogs.Wpf;

namespace Raw_Splitter___Merger.Merger
{
    /// <summary>
    /// Interaction logic for MergerUI.xaml
    /// </summary>
    public partial class MergerUI : UserControl, IToolComponent
    {
        #region "File Name Comparer"
        class FileNameComparer : IComparer<FileInfo>
        {
            int IComparer<FileInfo>.Compare(FileInfo? a, FileInfo? b)
            {
                if (a is null)
                {
                    if (b is null) return 0;
                    else return -1;
                }
                else if (b is null) return 1;
                return a.Name.CompareTo(b.Name);
            }
        }
        static readonly FileNameComparer comparer = new();
        #endregion

        #region "Image List & Merge List"
        ObservableSortedSet<FileInfo>? imageList;
        ObservableCollection<List<FileInfo>> mergeList = new();
        public void ChangeDirectory(string path)
        {
            var temp = new DirectoryInfo(path).GetFiles().Where(file => Settings.AllowedExtensions.Contains(file.Extension));
            imageList = new(comparer);
            foreach (FileInfo file in temp)
            {
                imageList.Add(file);
            }
            ImageListBox.ItemsSource = imageList;
            mergeList = new();
            MergeListBox.ItemsSource = mergeList;
        }
        void PreviewImage(object sender, SelectionChangedEventArgs e)
        {
            var listBox = sender as ListBox;
            if (listBox.SelectedItems.Count > 0)
                Viewer.Path = (listBox.SelectedItems[0] as FileInfo).FullName;
            else
                Viewer.Path = null;
        }
        void AddToMergeList(object sender, RoutedEventArgs e)
        {
            if (ImageListBox.SelectedIndex == -1) return;
            var imageListSelected = new List<FileInfo>(ImageListBox.SelectedItems.Cast<FileInfo>());
            mergeList.Add(imageListSelected);
            foreach (FileInfo item in imageListSelected)
                imageList.Remove(item);
        }
        void RemoveFromMergeList(object sender, RoutedEventArgs e)
        {
            if (MergeListBox.SelectedIndex == -1) return;
            var mergeListSelected = MergeListBox.SelectedItem as List<FileInfo>;
            foreach (FileInfo item in mergeListSelected)
                imageList.Add(item);
            mergeList.Remove(mergeListSelected);
        }
        #endregion

        #region "Processing"
        static readonly MergerWorker worker = new();
        void StartProcessing(object sender, RoutedEventArgs e)
        {
            if (mergeList.Count > 0)
            {
                var dialog = new VistaFolderBrowserDialog
                {
                    Multiselect = false,
                    ShowNewFolderButton = true
                };
                if (dialog.ShowDialog() ?? false)
                {
                    int padLength = (int)Math.Truncate(Math.Log10(mergeList.Count)) + 1;
                    for (int i = 0; i < mergeList.Count; i++)
                    {
                        var outputFile = string.Format($"{{0:D{padLength}}}.png", i + 1);
                        worker.AddToQueue(mergeList[i], Path.Combine(dialog.SelectedPath, outputFile));
                    }
                }
                OpenMergerWindow(sender, e);
            }
        }
        #endregion

        void OpenMergerWindow(object sender, RoutedEventArgs e)
        {
            new MergerWorkerWindow(worker).ShowDialog();
        }

        public MergerUI()
        {
            InitializeComponent();
        }
    }
}
