using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Raw_Splitter___Merger
{
    internal class Settings
    {
        public static readonly HashSet<string> AllowedExtensions = new(new[] { ".jpg", ".png", ".webp" });
    }
}
