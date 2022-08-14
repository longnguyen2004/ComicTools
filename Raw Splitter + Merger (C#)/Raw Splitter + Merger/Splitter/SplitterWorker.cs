using System;
using System.IO;
using System.Runtime.CompilerServices;
using System.ComponentModel;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using Raw_Splitter___Merger.Utility;
using ImageMagick;

namespace Raw_Splitter___Merger.Splitter
{
    public class SplitterWorker : INotifyPropertyChanged
    {
        #region "PropertyChanged"
        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
        #endregion

        #region "Queue System"
        public class QueueItem : INotifyPropertyChanged
        {
            public event PropertyChangedEventHandler? PropertyChanged;
            protected void OnPropertyChanged([CallerMemberName] string name = null)
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
            }
            public FileInfo File { get; private set; }
            public DirectoryInfo OutputDir { get; private set; }
            public List<int> SplitList { get; private set; }
            double _progress = 0;
            public double Progress
            {
                get { return _progress; }
                set
                {
                    _progress = value;
                    OnPropertyChanged();
                }
            }
            public QueueItem(ImageItem item, DirectoryInfo outputDir)
            {
                File = item.File;
                OutputDir = outputDir;
                SplitList = new(item.SplitList);
            }
        }
        readonly ObservableQueue<QueueItem> _queue = new();
        public IReadOnlyObservableBase<QueueItem> Queue { get => _queue; }
        public void AddToQueue(ImageItem item, DirectoryInfo outputDir)
        {
            _queue.Enqueue(new(item, outputDir));
        }
        QueueItem? _currentItem;
        public QueueItem? CurrentItem
        {
            get => _currentItem;
            set
            {
                _currentItem = value;
                OnPropertyChanged();
            }
        }
        #endregion

        #region "Processing"
        readonly CancellationTokenSource cancellation = new();
        readonly Task workerThrd;
        public bool IsRunning { get => workerThrd.Status == TaskStatus.Running; }
        static readonly ImageOptimizer optimizer = new();
        void StartProcessQueue(CancellationToken token)
        {
            QueueItem item;
            while (!token.IsCancellationRequested)
            {
                while (!_queue.TryDequeue(out item))
                {
                    if (token.IsCancellationRequested) return;
                    Thread.Sleep(1000);
                }
                CurrentItem = item;
                using MagickImage image = new(item.File);
                image.RePage();
                List<int> coordList = new(item.SplitList)
                {
                    image.Height
                };
                coordList.Insert(0, 0);
                int padLength = (int)Math.Truncate(Math.Log10(coordList.Count - 1)) + 1;
                for (int i = 1; i < coordList.Count; i++)
                {
                    StringBuilder builder = new();
                    builder.Append(item.File.Name.Replace(item.File.Extension, ""))
                           .Append('-')
                           .AppendFormat($"{{0:D{padLength}}}", i)
                           .Append(".png");
                    var fileName = Path.Combine(item.OutputDir.FullName, builder.ToString());
                    int start = coordList[i - 1], end = coordList[i];
                    using MagickImage cropped = new(image);
                    cropped.RePage();
                    cropped.Crop(new MagickGeometry(0, start, image.Width, end - start));
                    cropped.Write(fileName);
                    optimizer.Compress(fileName);
                    item.Progress = (double)end / image.Height;
                }
                CurrentItem = null;
            }
        }
        public bool StopProcessQueue()
        {
            if (!_queue.IsEmpty)
            {
                var cancelQueue = MessageBox.Show("There are items in the queue. Are you sure you want to stop?",
                    "Cancel Queue", MessageBoxButton.YesNo);
                if (cancelQueue == MessageBoxResult.No) return false;
                _queue.Clear();
            }
            cancellation.Cancel();
            return true;
        }
        #endregion

        public SplitterWorker()
        {
            CancellationToken token = cancellation.Token;
            workerThrd = Task.Run(() => StartProcessQueue(token), token);
        }
    }
}
