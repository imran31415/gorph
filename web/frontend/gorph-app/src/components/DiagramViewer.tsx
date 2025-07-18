import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';

interface DiagramViewerProps {
  svg: string;
  dotContent?: string;
  style?: any;
  onTogglePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
}

interface SvgRendererProps {
  svgContent: string;
  zoom: number;
}

// Web-specific SVG renderer component
function SvgRenderer({ svgContent, zoom }: SvgRendererProps) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && Platform.OS === 'web') {
      // @ts-ignore - we know this is web and containerRef.current is a DOM element
      containerRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        minHeight: '300px'
      }}
    />
  );
}

export default function DiagramViewer({ svg, dotContent, style, onTogglePane, isExpanded, canExpand }: DiagramViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.2));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // Try to render DOT content using QuickChart GraphViz API
  const renderDotWithAPI = async (dotCode: string) => {
    if (Platform.OS !== 'web') return;
    
    setIsRendering(true);
    setRenderError('');
    
    try {
      console.log('Rendering DOT with QuickChart API...');
      
      // Use QuickChart GraphViz API
      const response = await fetch('https://quickchart.io/graphviz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph: dotCode,
          format: 'svg'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const svg = await response.text();
      console.log('SVG generated successfully');
      setRenderedSvg(svg);
      setIsRendering(false);
      
    } catch (error) {
      console.error('API rendering failed:', error);
      setRenderError(error instanceof Error ? error.message : 'API rendering failed');
      setIsRendering(false);
    }
  };

  // Try to render when dotContent changes
  useEffect(() => {
    if (dotContent && Platform.OS === 'web') {
      renderDotWithAPI(dotContent);
    }
  }, [dotContent]);

  const downloadSVG = () => {
    if (Platform.OS === 'web' && svg) {
      try {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'infrastructure-diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Downloaded!', 'SVG diagram has been downloaded');
      } catch (err) {
        console.error('Failed to download: ', err);
        Alert.alert('Error', 'Failed to download SVG');
      }
    } else {
      Alert.alert('Download', 'Download functionality is available on web only');
    }
  };

  // Show loading state while rendering
  if (isRendering) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
          </View>
          <View style={styles.headerControls}>
            <Text style={styles.statusText}>Rendering...</Text>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '-' : '+'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Generating diagram...</Text>
          <Text style={styles.emptySubtext}>
            Please wait while we render your infrastructure diagram
          </Text>
        </View>
      </View>
    );
  }

  // Show rendered SVG if available
  if (renderedSvg && Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
          </View>
          <View style={styles.headerControls}>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomReset}>
                <Text style={styles.zoomButtonText}>{Math.round(zoom * 100)}%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '⤡' : '⤢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView style={styles.scrollView} maximumZoomScale={3} minimumZoomScale={0.2}>
          <SvgRenderer svgContent={renderedSvg} zoom={zoom} />
        </ScrollView>
      </View>
    );
  }

  if (!dotContent || dotContent.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
          </View>
          <View style={styles.headerControls}>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '⤡' : '⤢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No diagram to display</Text>
          <Text style={styles.emptySubtext}>
            Enter YAML infrastructure definition to see the diagram
          </Text>
        </View>
      </View>
    );
  }

  // Show render error if there was one
  if (renderError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
          </View>
          <View style={styles.headerControls}>
            <Text style={[styles.statusText, { color: '#dc2626' }]}>Render Error</Text>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '⤡' : '⤢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to render diagram</Text>
          <Text style={styles.emptySubtext}>
            {renderError}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => dotContent && renderDotWithAPI(dotContent)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // For web platform, show instructions since WebView doesn't work
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
          </View>
          <View style={styles.headerControls}>
            <Text style={styles.statusText}>DOT Ready for Visualization</Text>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '⤡' : '⤢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.instructionsContainer}>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>📊 Visualize Your Infrastructure</Text>
            <Text style={styles.instructionText}>
              Your DOT notation is ready! Choose your preferred method to create the visual diagram:
            </Text>
            
            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>🌐 Online (Recommended):</Text>
              <Text style={styles.methodStep}>1. Copy the DOT output from the middle pane</Text>
              <Text style={styles.methodStep}>2. Visit: dreampuf.github.io/GraphvizOnline</Text>
              <Text style={styles.methodStep}>3. Paste your DOT code and click "Generate Graph!"</Text>
              <Text style={styles.methodStep}>4. Download as PNG, SVG, or PDF</Text>
            </View>

            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>💻 Command Line:</Text>
              <Text style={styles.methodStep}>1. Copy DOT output and save as 'diagram.dot'</Text>
              <Text style={styles.methodStep}>2. Install Graphviz: brew install graphviz</Text>
              <Text style={styles.methodStep}>3. Run: dot -Tpng diagram.dot -o diagram.png</Text>
              <Text style={styles.methodStep}>4. Open diagram.png to view your infrastructure</Text>
            </View>

            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>🛠️ Gorph CLI:</Text>
              <Text style={styles.methodStep}>1. Save your YAML as 'infrastructure.yml'</Text>
              <Text style={styles.methodStep}>2. Run: ./gorph -input infrastructure.yml -png diagram.png</Text>
              <Text style={styles.methodStep}>3. Get instant PNG diagrams with styling!</Text>
            </View>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>💡 Pro Tip:</Text>
              <Text style={styles.tipText}>
                The Gorph CLI tool (make run-cli) generates both DOT and PNG files automatically
                with the same styling rules used in this web interface.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile fallback - show SVG in ScrollView
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>📊 Diagram</Text>
        </View>
                  <View style={styles.headerControls}>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomReset}>
                <Text style={styles.zoomButtonText}>{Math.round(zoom * 100)}%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '⤡' : '⤢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        maximumZoomScale={3}
        minimumZoomScale={0.2}
        showsHorizontalScrollIndicator
        showsVerticalScrollIndicator
      >
        <View style={styles.mobileEmptyContainer}>
          <Text style={styles.emptyText}>Diagram rendering not available on mobile</Text>
          <Text style={styles.emptySubtext}>
            Please use the web version to view diagrams
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoomButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  zoomButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionContent: {
    padding: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  methodContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  methodStep: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
    paddingLeft: 8,
    lineHeight: 18,
  },
  tipContainer: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  mobileEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  expandButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
}); 