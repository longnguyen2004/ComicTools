using System;
using System.ComponentModel;
using System.Collections.Concurrent;
using System.Collections.Specialized;
using System.Threading;

namespace Raw_Splitter___Merger.Utility
{
    public class ObservableQueue<T>: ConcurrentQueue<T>, IReadOnlyObservableBase<T>
    {
        public static readonly PropertyChangedEventArgs CountChangedEventArgs = new(nameof(Count));
        public event PropertyChangedEventHandler? PropertyChanged;
        public event NotifyCollectionChangedEventHandler? CollectionChanged;

        private SynchronizationContext ctx = SynchronizationContext.Current;

        private void OnPropertyChanged(PropertyChangedEventArgs e)
        {
            if (ctx == SynchronizationContext.Current)
            {
                PropertyChanged?.Invoke(this, e);
            }
            else
            {
                ctx.Send((e) => PropertyChanged?.Invoke(this, (PropertyChangedEventArgs)e), e);
            }
        }
        private void OnCollectionChanged(NotifyCollectionChangedEventArgs e)
        {
            if (ctx == SynchronizationContext.Current)
            {
                CollectionChanged?.Invoke(this, e);
            }
            else
            {
                ctx.Send((e) => CollectionChanged?.Invoke(this, (NotifyCollectionChangedEventArgs)e), e);
            }
        }
        new public void Clear()
        {
            base.Clear();
            OnPropertyChanged(CountChangedEventArgs);
            OnCollectionChanged(new(NotifyCollectionChangedAction.Reset));
        }
        new public void CopyTo(T[] array, int index) => base.CopyTo(array, index);
        new public void Enqueue(T item)
        {
            base.Enqueue(item);
            OnPropertyChanged(CountChangedEventArgs);
            OnCollectionChanged(new(NotifyCollectionChangedAction.Add, item, Count));
        }
        new public bool TryDequeue(out T result)
        {
            bool success;
            if (success = base.TryDequeue(out result))
            {
                OnPropertyChanged(CountChangedEventArgs);
                OnCollectionChanged(new(NotifyCollectionChangedAction.Remove, result, 0));
            }
            return success;
        }
    }
}
