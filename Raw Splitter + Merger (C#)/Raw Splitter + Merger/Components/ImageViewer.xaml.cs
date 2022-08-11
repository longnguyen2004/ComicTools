using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
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
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Raw_Splitter___Merger.Components
{
    /// <summary>
    /// Interaction logic for ImageViewer.xaml
    /// </summary>
    public partial class ImageViewer : DockPanel
    {
        public event EventHandler<Point>? Click_GetCoords;

        private Point coords;
        private BitmapImage _currentImage;
        public static readonly DependencyProperty PathProperty = DependencyProperty.Register(
            "Path", typeof(string), typeof(ImageViewer)
        );
        public string? Path
        {
            get
            {
                return (string)GetValue(PathProperty);
            }
            set
            {
                SetValue(PathProperty, value);
                if (value is null)
                {
                    _Image.Source = null;
                    _currentImage = null;
                }
                else
                {
                    _currentImage = new BitmapImage(new Uri(value));
                    DisplayImage();
                    Viewer.ScrollToTop();
                }
            }
        }
        private void DisplayImage()
        {
            if (_currentImage is not null)
            {
                var scalingFactor = Viewer.ActualWidth / _currentImage.PixelWidth;
                var newHeight = _currentImage.PixelHeight * scalingFactor;
                if (newHeight > RenderCapability.MaxHardwareTextureSize.Height)
                    scalingFactor *= RenderCapability.MaxHardwareTextureSize.Height / newHeight;
                _Image.Source = new TransformedBitmap(_currentImage, new ScaleTransform(scalingFactor, scalingFactor));
            }
        }
        public ImageViewer()
        {
            InitializeComponent();
            // RenderOptions.ProcessRenderMode = System.Windows.Interop.RenderMode.SoftwareOnly;
        }
        private void _Image_MouseMove(object sender, MouseEventArgs e)
        {
            coords = e.GetPosition(_Image);
            var scalingFactor = _currentImage.PixelWidth / Viewer.ActualWidth;
            coords.X *= scalingFactor;
            coords.Y *= scalingFactor;
            _coordsViewer.DataContext = coords;
        }
        private void Viewer_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            if (e.WidthChanged && _currentImage is not null)
            {
                DisplayImage();
                Viewer.ScrollToVerticalOffset(Viewer.VerticalOffset * e.NewSize.Height / e.PreviousSize.Height);
            }
        }
        private void _Image_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (Click_GetCoords is not null)
            {
                Click_GetCoords(this, coords);
            }
        }
    }
}
