using System;
using System.IO;
using System.Runtime.CompilerServices;
using System.ComponentModel;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using Raw_Splitter___Merger.Utility;
using ImageMagick;

namespace Raw_Splitter___Merger.Merger
{
    public class MergerWorker: INotifyPropertyChanged
    {
        #region "PropertyChanged"
        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
        #endregion

        #region "Queue System"
        public class QueueItem
        {
            public List<FileInfo> MergeList { get; private set; }
            public string OutputFile { get; private set; }
            public QueueItem(IEnumerable<FileInfo> mergeList, string outputFile)
            {
                MergeList = new(mergeList);
                OutputFile = outputFile;
            }
        }
        readonly ObservableQueue<QueueItem> _queue = new();
        public IReadOnlyObservableBase<QueueItem> Queue { get => _queue; }
        public void AddToQueue(IEnumerable<FileInfo> mergeList, string outputFile)
        {
            _queue.Enqueue(new(mergeList, outputFile));
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
                using MagickImageCollection collection = new();
                foreach (FileInfo image in item.MergeList)
                    collection.Add(new MagickImage(image));
                using var result = collection.AppendVertically();
                result.Write(item.OutputFile);
                optimizer.Compress(item.OutputFile);
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

        public MergerWorker()
        {
            CancellationToken token = cancellation.Token;
            workerThrd = Task.Run(() => StartProcessQueue(token), token);
        }
    }
}
