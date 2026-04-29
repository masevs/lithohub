// Map state
let map;
let dataSource;
let selectedAsset = null;

/**
 * initMap()
 * Initializes Azure Maps and loads asset data
 */
function initMap() {
    map = new atlas.Map('map', {
        center: [113.0, -1.5],
        zoom: 4,
        authOptions: {
            authType: atlas.AuthenticationType.subscriptionKey,
            subscriptionKey: '8yVxYz9pur5VagwG7K45dpTjidlGI6bNWq2fPC8ah1JFIm1kf4EaJQQJ99CDACYeBjFkEY5HAAAgAZMP3iY3'
        }
    });

    map.events.add('ready', function() {
        console.log('Map ready');
        dataSource = new atlas.source.DataSource();
        map.sources.add(dataSource);

        loadAssets(() => {
            console.log('Assets loaded, adding markers...');
            addAssetMarkers();

            map.layers.add(new atlas.layer.BubbleLayer(dataSource, null, {
                radius: 8,
                fillColor: '#667eea',
                fillOpacity: 0.7,
                strokeColor: '#fff',
                strokeWidth: 2
            }));

            map.events.add('click', dataSource, onMarkerClick);
            console.log('Map initialization complete');
        });
    });
}

/**
 * loadAssets(callback)
 * Fetches assets.json and stores data globally
 */
function loadAssets(callback) {
    const path = 'data/assets.json';
    console.log('Fetching assets from:', path);

    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Assets loaded successfully:', data.length, 'items');
            window.assetsData = data;
            if (callback) callback();
        })
        .catch(error => {
            console.error('Error loading assets:', error);
            alert('Failed to load assets. Check that data/assets.json exists and is valid JSON.');
        });
}

/**
 * addAssetMarkers()
 * Adds markers to the map for each asset
 */
function addAssetMarkers() {
    if (!window.assetsData || window.assetsData.length === 0) {
        console.error('Assets data not loaded');
        return;
    }

    console.log('Adding', window.assetsData.length, 'markers to map');

    window.assetsData.forEach(asset => {
        const point = new atlas.data.Feature(
            new atlas.data.Point([asset.longitude, asset.latitude]),
            {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                location: asset.location
            }
        );
        dataSource.add(point);
    });
}

/**
 * onMarkerClick(e)
 * Handles click events on map markers
 */
function onMarkerClick(e) {
    if (!e.shapes || e.shapes.length === 0) return;

    const properties = e.shapes[0].getProperties();
    const assetId = properties.id;

    console.log('Marker clicked:', assetId);

    selectedAsset = window.assetsData.find(a => a.id === assetId);

    if (selectedAsset) {
        console.log('Selected asset:', selectedAsset.name);
        updateUI();

        map.setCamera({
            center: [selectedAsset.longitude, selectedAsset.latitude],
            zoom: 6
        });
    } else {
        console.error('Asset not found in data:', assetId);
    }
}

// Initialize map when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, initializing map...');
    initMap();
});
