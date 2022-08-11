using System.IO;
using System.ComponentModel;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using Raw_Splitter___Merger.Utility;

namespace Raw_Splitter___Merger.Splitter
{
    public class ImageItem : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        public FileInfo File { get; private set; }
        public ObservableSortedSet<int> SplitList { get; private set; }
        public ImageItem(FileInfo file)
        {
            File = file;
            SplitList = new();
            SplitList.CollectionChanged += (sender, e) => PropertyChanged?.Invoke(this, new(nameof(SplitList)));
        }
    }
    public class ImageList : ObservableCollection<ImageItem>
    {
        public ImageList(IEnumerable<FileInfo> fileList) : base(fileList.Select(file => new ImageItem(file)))
        {
        }
    }
}