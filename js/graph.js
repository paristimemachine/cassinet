// Old test / compute graph without API and Pgrouting
function convertGeoJSONToGraph(geojsonData) {
    const graph = new graphology.MultiUndirectedGraph();
    
    let i=0

    geojsonData.features.forEach(feature => {
      const startNode = feature.properties.start_node;
      const endNode = feature.properties.end_node;
      const length = feature.properties.length || 1;
  
      if (!graph.hasNode(startNode)) {
        graph.addNode(startNode);
      }
      if (!graph.hasNode(endNode)) {
        graph.addNode(endNode);
      }
  
      graph.addEdgeWithKey(i, startNode, endNode, {weight: length});
      i += 1;
      
    });
  
    return graph;
  }
  
  fetch('data/cassini_edges.geojson')
    .then(response => response.json())
    .then(geojsonData => {
      const graph = convertGeoJSONToGraph(geojsonData);
  
      const startNodeId = '23607';
      const endNodeId = '21958';
      const shortestPath = dijkstra(graph, startNodeId, endNodeId, {
        weight: 'length'
      });
  
      console.log(shortestPath);
    })
    .catch(error => console.error('Erreur lors du chargement du GeoJSON:', error));