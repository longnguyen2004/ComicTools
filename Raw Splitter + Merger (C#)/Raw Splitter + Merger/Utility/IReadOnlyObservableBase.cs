using System;
using System.ComponentModel;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Collections;

namespace Raw_Splitter___Merger.Utility
{
    public interface IReadOnlyObservableBase<T>:
        IReadOnlyCollection<T>,
        ICollection,
        IEnumerable,
        IEnumerable<T>,
        INotifyPropertyChanged,
        INotifyCollectionChanged
    {
    }
}
