using System;
using System.ComponentModel;
using System.Collections.Specialized;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MCollections;

namespace Raw_Splitter___Merger.Utility
{
    public class ObservableSortedSet<T> : IndexedSet<T>, IReadOnlyObservableBase<T>
    {
        public static readonly PropertyChangedEventArgs CountChangedEventArgs = new("Count");
        public static readonly PropertyChangedEventArgs MinChangedEventArgs = new("Min");
        public static readonly PropertyChangedEventArgs MaxChangedEventArgs = new("Max");
        public event PropertyChangedEventHandler? PropertyChanged;
        public event NotifyCollectionChangedEventHandler? CollectionChanged;

        new public bool Add(T item)
        {
            bool result;
            if (result = base.Add(item))
            {
                PropertyChanged?.Invoke(this, CountChangedEventArgs);
                PropertyChanged?.Invoke(this, MinChangedEventArgs);
                PropertyChanged?.Invoke(this, MaxChangedEventArgs);
                CollectionChanged?.Invoke(this, new(NotifyCollectionChangedAction.Add, item, IndexOfKey(item)));
            }
            return result;
        }

        new public bool Remove(T item)
        {
            int position = IndexOfKey(item);
            bool result;
            if (result = base.Remove(item))
            {
                PropertyChanged?.Invoke(this, CountChangedEventArgs);
                PropertyChanged?.Invoke(this, MinChangedEventArgs);
                PropertyChanged?.Invoke(this, MaxChangedEventArgs);
                CollectionChanged?.Invoke(this, new(NotifyCollectionChangedAction.Remove, item, position));
            }
            return result;
        }

        new public void Clear()
        {
            base.Clear();
            PropertyChanged?.Invoke(this, CountChangedEventArgs);
            PropertyChanged?.Invoke(this, MinChangedEventArgs);
            PropertyChanged?.Invoke(this, MaxChangedEventArgs);
            CollectionChanged?.Invoke(this, new(NotifyCollectionChangedAction.Reset));
        }

        public ObservableSortedSet(): base()
        {

        }
        public ObservableSortedSet(IComparer<T> comparer): base(comparer)
        {

        }
    }
}
