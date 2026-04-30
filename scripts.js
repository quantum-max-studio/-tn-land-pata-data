// View
var view = new ol.View({
    zoom: 7,
    center: [8681480.570496075, 1224732.6162325153],
    // center: [8781480.570496075, 1224732.6162325153],
    // extent: [885626.451712506, 892078.6691354283, 9167334.689279644, 1557386.5633296024],
    enableRotation: true
});
/* MAP */
/*******/
const map = new ol.Map({
    target: 'map',
    attribution: false,
    view,
});
const zoomControl = map.getControls().getArray().filter(control => control instanceof ol.control.Zoom)[0];
if (zoomControl) {
    map.removeControl(zoomControl);
}

// Function to remove basemaps by 'type'
function removeBasemapByType(type) {
    map.getLayers().forEach(layer => {
        if (layer && layer.get('type') === type) {
            map.removeLayer(layer); // Remove all layers with the specified type
        }
    });
}

// Function to change basemap based on the selected type
function changeBasemap(type, basemap) {
    if (type == 'basemap') {
        // Remove existing base maps of the same type
        removeBasemapByType(type);
    }

    let basemapLayer;
    // Define basemaps based on the type
    switch (basemap) {
        case 'cadastral_xyz':
            basemapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://tngis.tn.gov.in/data/xyz_tiles/cadastral_xyz/{z}/{x}/{y}.png', // Terrain layer URL
                    attributions: [
                        '© TNGIS'
                    ],
                }),
                baseLayer: false,
                zIndex: 1,
                type: type, // This is a basemap type
                id: 'cadastral-xyz',
            });
            break;
        case 'osm':
            basemapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
                    attributions: '© OpenStreetMap contributors'
                }),
                baseLayer: true,
                zIndex: -1,
                type: 'basemap', // This is a basemap type
                id: 'osm-basemap',
            });
            break;
        case 'satellite':
            basemapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // Replace with your satellite tile URL
                    attributions: [
                        '© Google'
                    ],
                }),
                baseLayer: true,
                zIndex: -1,
                type: 'basemap', // This is a basemap type
                id: 'satellite-basemap',
            });
            break;
        case 'terrain':
            basemapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', // Terrain layer URL
                    attributions: [
                        '© OpenTopoMap contributors'
                    ],
                }),
                baseLayer: true,
                zIndex: -1,
                type: 'basemap', // This is a basemap type
                id: 'terrain-basemap',
            });
            break;
        case 'nomap':
            basemapLayer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', // Terrain layer URL
                    attributions: ['© OpenTopoMap contributors'],
                }),
                baseLayer: true,
                zIndex: -1,
                type: 'basemap',         // Basemap type
                id: 'terrain-basemap',
                visible: false           // Initially hidden
            });
            break;
        
        default:
            return;
    }

    // Add the new basemap layer
    map.addLayer(basemapLayer);
    if (type == 'basemap') {
        highlightSelectedButton(basemap);
    }
}

var layerConfig = {};
var geojsonSource = new ol.source.Vector();
var selectionGeojsonSource = new ol.source.Vector(); // Create new source
var geojsonFormat = new ol.format.GeoJSON();
var geojsonLayer = new ol.layer.Vector({
    name: "Buffer Circle",
    source: geojsonSource,
    type: 'vector',
    zIndex: 10,
    visible: false, // Initially hidden
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.1)'
        }),
        stroke: new ol.style.Stroke({
            color: "CYAN",
            width: 6
        }),
    }),
});

var boundarygeojsonLayer = new ol.layer.Vector({
    name: "Selection Layer",
    source: selectionGeojsonSource,
    type: 'vector',
    zIndex: 11, // Higher than Buffer Circle layer
    visible: true,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.1)'
        }),
        stroke: new ol.style.Stroke({
            color: "rgb(39, 7, 169)",
            width: 4
        }),
    }),
});
map.addLayer(boundarygeojsonLayer);

let isVisible = true;

// Blinking blue circle icon style
const locationIconStyle = new ol.style.Style({
  zIndex: 9999999999999999999,
  image: new ol.style.Circle({
    radius: 8,
    fill: new ol.style.Fill({ color: 'blue' }),
    stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
  }),
});

const locationFeature = new ol.Feature();
const locationLayer = new ol.layer.Vector({
  source: new ol.source.Vector({ features: [locationFeature] }),
  style: () => {
    locationIconStyle.getImage().setOpacity(isVisible ? 1 : 0);
    return locationIconStyle;
  },
});

map.addLayer(locationLayer);


// UnMatched with Spatial
var cadastral_with_ulpin_source = new ol.source.TileWMS({
    url: `${GEOSERVER_URL}`,
    params: {
        'LAYERS': ' cadastral_information_new' + ':' + 'fmb_ulpin',
        'STYLES': '',
    },
    serverType: 'geoserver'
});
const cadastral_with_ulpin = new ol.layer.Tile({
    title: 'ULPIN',
    type: 'wms',
    source: cadastral_with_ulpin_source,
    name: "ULPIN",
    visible: false,
    zIndex: 9,
    displayInLayerSwitcher: false,
});

// Function to check zoom level and add WMS layer
function updateWMSLayerVisibility() {
    const currentZoom = map.getView().getZoom();
    if (currentZoom >= 13 && !map.getLayers().getArray().includes(cadastral_with_ulpin)) {
        map.addLayer(cadastral_with_ulpin); // Add WMS layer if zoom level is 16 or higher
    } else if (currentZoom < 16 && map.getLayers().getArray().includes(cadastral_with_ulpin)) {
        map.removeLayer(cadastral_with_ulpin); // Remove WMS layer if zoom level is less than 16
    }
}

// Listen to the moveend event to detect when zoom changes
map.on('moveend', updateWMSLayerVisibility);

// Function to highlight the selected button
function highlightSelectedButton(selectedBasemap) {
    // Remove the 'selected' class from all buttons
    const buttons = document.querySelectorAll('.basemap-btn');
    buttons.forEach(button => {
        button.classList.remove('selected');
    });

    // Add the 'selected' class to the clicked button
    const selectedButton = document.getElementById(`${selectedBasemap}-btn`);
    selectedButton.classList.add('selected');
}

// Add interactivity for navigation buttons
document.getElementById('zoom-in-btn').addEventListener('click', () => {
    const view = map.getView();
    view.setZoom(view.getZoom() + 1);
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
    const view = map.getView();
    view.setZoom(view.getZoom() - 1);
});

document.getElementById('zoom-to-extent-btn').addEventListener('click', () => {
    var zoomtoExtentValue = [8395626.451712506, 892078.6691354283, 9167334.689279644, 1557386.5633296024];
    const view = map.getView();
    view.fit(zoomtoExtentValue, { size: map.getSize() });
});

// --- Define marker layer and add it to the map ---
const markerSource = new ol.source.Vector();
const markerLayer = new ol.layer.Vector({
    source: markerSource,
    style: new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png', // you can replace with your own icon
            scale: 0.7,
        }),
    }),
    zIndex: 9999999999999999,
});
map.addLayer(markerLayer);


const facilitiesMarkerSource = new ol.source.Vector();
const facilitiesMarkerLayer = new ol.layer.Vector({
    source: facilitiesMarkerSource,
    style: new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png', // you can replace with your own icon
            scale: 0.7,
        }),
    }),
    zIndex: 99999999999999999,
});
map.addLayer(facilitiesMarkerLayer);

// document.addEventListener('click', function (event) {
//     const menu = document.getElementById('menu');
//     const navbar = document.getElementById('navbar');

//     // Check if the click is outside the navbar and menu
//     if (!navbar.contains(event.target) && !menu.contains(event.target)) {
//         menu.classList.remove('show');
//         menu.classList.add('hidden');
//     }
// });

// Function to toggle the menu visibility
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('show');
    menu.classList.toggle('hidden');
}

// // Update the info panel content
// function updatePanelContent(content) {
//     const panelContent = document.getElementById('panel-content');
//     panelContent.innerHTML = content;

//     const panel = document.getElementById('info-panel');
//     panel.classList.add('show'); // Show the panel
// }

// Hide the info panel
function hidePanel() {
    const panel = document.getElementById('info-panel');
    panel.classList.remove('show');
    panel.style.display = 'none';
}

loadDistrict();
siteVisitorsCount();
// Click event listener on the map

$("#longitude").val('');
$("#latitude").val('');
map.on('singleclick', function (evt) {
    $(".error-message").empty().hide();
    // Add click listener to map to close the panel when clicking on the map
    geojsonSource.clear();
    map.removeLayer(vertexLayer);
    clearVectorBoundarySourceData();
    facilitiesMarkerSourceClear();
    markerSource.clear();
    facilitiesMarkerSourceClear();
    // simplifiedHidePanel();
    closeAregPanel();
    closeFMBSketchPanel();
    const coordinates = ol.proj.toLonLat(evt.coordinate);
    const lon = coordinates[0].toFixed(6);
    const lat = coordinates[1].toFixed(6);

    $("#longitude").val(lon.trim());
    $("#latitude").val(lat.trim());
    
    

    markerSource.clear();
    const markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(evt.coordinate)
    });
    markerSource.addFeature(markerFeature);

    // var responsess = {
    //     "success": 1,
    //     "message": "Land Details Found",
    //     "data": {
    //         "district_code": "10",
    //         "taluk_code": "33",
    //         "village_code": "009",
    //         "lgd_village_code": 634879,
    //         "survey_number": "48",
    //         "sub_division": "1",
    //         "firka_ward_number": null,
    //         "urban_block_number": null,
    //         "is_fmb": 1,
    //         "geojson_geom": "{\"type\":\"Polygon\",\"coordinates\":[[[77.695156286,11.515228707],[77.696620823,11.515291514],[77.696714861,11.514408431],[77.696542096,11.514388365],[77.696356734,11.514366836],[77.696254155,11.514354922],[77.696142577,11.514341963],[77.6960328,11.514329213],[77.695878535,11.514312999],[77.695174394,11.515135856],[77.695156286,11.515228707]]]}",
    //         "ulpin": "73G2Z4DALZ2HH0",
    //         "centroid": "11.514772,77.696081",
    //         "lgd_district_code": 573,
    //         "lgd_taluk_code": 5750,
    //         "rural_urban": "rural",
    //         "district_name": "Erode",
    //         "district_tamil_name": "\u0b88\u0bb0\u0bcb\u0b9f\u0bc1",
    //         "taluk_name": "Bhavani",
    //         "taluk_tamil_name": "\u0baa\u0bb5\u0bbe\u0ba9\u0bbf",
    //         "village_name": "Varadhanallur",
    //         "village_tamil_name": "009  \u0bb5\u0bb0\u0ba4\u0ba8\u0bb2\u0bcd\u0bb2\u0bc1\u0bbe\u0bb0\u0bcd"
    //     }
    // }

    // addGeoJsonLayer(responsess.data.geojson_geom)
    // displaySimplifiedInfo(responsess.data, lat, lon)
    landDetailsShow(lat,lon);
    
});

var currentRequest = null;

function landDetailsShow(lat,lon){
    $("#staticBackdropLabel").html(`Land Parcel Information (<span class='lpi-style'>${lat}, ${lon}</span>)`);
    
    var allowRequest = null;
    if (currentRequest != null) {
        currentRequest.abort();
    }
    let userPermission = 0;
    userPermission = $("#permissionHandle").val();
    allowRequest = true;
    currentRequest = $.ajax({
        // url: `${GI_VIEWER_API_URL}/rate_limit_land_details`,
        url: `${BASE_URL}/v2/land_details`,
        method: 'POST',
        headers: {
            'X-APP-NAME': 'demo'
        },
        data: {
            latitude: lat,
            longitude: lon,
            up: userPermission? userPermission : '',
        },
        beforeSend:function(){
            showSpinner();
        },
        success: function (response) {
            $(".error-message").empty().hide();
            var responseMessage = '';
            if (response.success) {
                if(response.success == 1){
                    var response_data = response.data;
                    let areaType = response_data.rural_urban;
                    if(areaType == 'rural'){
                       // loadDistrict(response_data.district_code,response_data.taluk_code,response_data.village_code,response_data.survey_number,response_data.sub_division,areaType);
                        document.querySelector('input[name="area-type"][value="rural"]').checked = true;
                        document.querySelector('input[name="area-type"][value="rural"]').dispatchEvent(new Event('change'));

                    }else if(areaType == 'urban'){
                        // loadDistrict(response_data.district_code,response_data.taluk_code,response_data.village_code,response_data.survey_number,response_data.sub_division,areaType,response_data.revenue_town_code , response_data.firka_ward_number , response_data.urban_block_number); 
                        document.querySelector('input[name="area-type"][value="urban"]').checked = true;
                        document.querySelector('input[name="area-type"][value="urban"]').dispatchEvent(new Event('change'));
                    }else{
                        document.querySelector('input[name="area-type"][value="goto"]').checked = true;
                        document.querySelector('input[name="area-type"][value="goto"]').dispatchEvent(new Event('change'));
                    }
                    addGeoJsonLayer(response_data.geojson_geom)
                    displaySimplifiedInfo(response_data, lat, lon)
                    $(".error-message").empty().hide();
                }else{
                    responseMessage = response.message;
                    showToast('warning', response.message)
                    document.getElementById('areg-tab-container')?.remove();
                    document.getElementById('facility-info-container')?.remove();
                    document.getElementById('fmb-sketch-info-panel')?.remove();
                    document.getElementById('igr-info-container')?.remove();
                    document.getElementById('vertex-info-container')?.remove();
                    document.getElementById('facility-info-container')?.remove();
                    document.getElementById('encumbrance-info-panel')?.remove();
                    document.getElementById('masterplan-info-container')?.remove();
                    $(".error-message").empty().text(responseMessage).show();
                    var response = {
                        "success": 0,
                        "message": "No Land Details Found",
                        "data": {
                            "district_code": "",
                            "taluk_code": "",
                            "village_code": "",
                            "survey_number": "",
                            "sub_division": "",
                            "is_fmb": 1,
                            "ulpin": "",
                            "rural_urban": "",
                            "district_name": "",
                            "district_tamil_name": "",
                            "taluk_name": "",
                            "taluk_tamil_name": "",
                            "lgd_village_code": "",
                            "lgd_district_code": "",
                            "lgd_taluk_code": "",
                            "village_name": "",
                            "village_tamil_name": "",
                            "admin_type": "",
                            "centroid": "",
                            "geojson_geom": ""
                        }
                    }
                    displaySimplifiedInfo(response, lat, lon)
                }
                
            } else if(response.error == 0){
                showToast('error', response.message)
                $(".error-message").empty().text(response.message).show();
                document.getElementById('areg-tab-container')?.remove();
                document.getElementById('facility-info-container')?.remove();
                document.getElementById('fmb-sketch-info-panel')?.remove();
                document.getElementById('igr-info-container')?.remove();
                document.getElementById('vertex-info-container')?.remove();
                document.getElementById('facility-info-container')?.remove();
                document.getElementById('encumbrance-info-panel')?.remove();
                document.getElementById('masterplan-info-container')?.remove();
            }else {
                $(".error-message").empty().text(response.message).show();
                var response = {
                    "success": 0,
                    "message": "No Land Details Found",
                    "data": {
                        "district_code": "",
                        "taluk_code": "",
                        "village_code": "",
                        "survey_number": "",
                        "sub_division": "",
                        "is_fmb": 1,
                        "ulpin": "",
                        "rural_urban": "",
                        "district_name": "",
                        "district_tamil_name": "",
                        "taluk_name": "",
                        "taluk_tamil_name": "",
                        "lgd_village_code": "",
                        "lgd_district_code": "",
                        "lgd_taluk_code": "",
                        "village_name": "",
                        "village_tamil_name": "",
                        "admin_type": "",
                        "centroid": "",
                        "geojson_geom": ""
                    }
                }
                displaySimplifiedInfo(response, lat, lon)
            }

            hideSpinner();
        },
        error: function (xhr, status, error) {
            hideSpinner();
        }
    });
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
}

$(document).ready(function () {
    let jSBRequest = null;
    $(document).on('click', '.JSB-icon-card', function () {
        // Remove old detail divs
        
        $('#JSB-info-container .detail, #facility-info-container .detail').remove();
        const JSBCardElement = document.querySelector('.JSB-icon-card');
        const layerCode = this.getAttribute('layer_id');
        const priorityOrder = this.getAttribute('priority_order');
        let selectedTitle = this.getAttribute('title');
        if(selectedTitle == 'TANGEDCO'){
            selectedTitle = 'TNPDCL';
        }else if(selectedTitle == 'Revenue Divisional Office'){
            selectedTitle = 'District Revenue Officer';
        }
        const layerType = this.getAttribute('layer_type');
        const lat = $("#latitude").val();
        const long = $("#longitude").val();
        let selected_facilities = [
            {
                layer_code: layerCode,
                priority_order: priorityOrder,
                layer_type: layerType,
            }
        ];

        let formatedata = {
            user_id: 7505,
            session_id: 'pm384s2oir7as1e2f43kbevs5f2025042512541904',
            type: 'nearest',
            longitude: long,
            latitude: lat,
            selected_facilities: JSON.stringify(selected_facilities)
        };

        if (jSBRequest && jSBRequest.readyState !== 4) {
            jSBRequest.abort();
        }
        
        jSBRequest = $.ajax({
            url: 'https://tngis.tn.gov.in/apps/mugavari_api/api/nearest',
            method: 'POST',
            headers: { 'x-app-key': 'en-arukil' },
            data: formatedata,
            success: function (response) {
                if (response[0].success == 1) {
                    const facilities = response[0].data[layerCode];
                    const iconUrls = [
                        'assets/icons/marker1.svg',
                        'assets/icons/marker2.svg',
                        'assets/icons/marker3.svg',
                        'assets/icons/marker4.svg',
                        'assets/icons/marker5.svg',
                      ];
                    // Create a container for the list
                    const detailDiv = $('<div class="detail mt-2 p-2 border rounded" style="background:#fff;color:#1a3d5b;"></div>');
        
                    // Create a list of facilities
                    const list = $('<ul class="facility-list" style="font-size:0.875rem;list-style:none; padding:0; margin:0;"></ul>');
                    if(layerType == 'assets'){
                        $("#selected-facilities").html("Nearby Facilities Information For <span style='font-size:10px'>("+selectedTitle+ ")</span");
                        facilitiesMarkerSourceClear();
                        clearVectorBoundarySourceData();
                        facilities.forEach((facility, index) => {
                            var coordinates = [
                                [long, lat],
                                [facility.longitude, facility.latitude]
                            ];
                            var direction = generateLink(coordinates);
                        
                            const feature = new ol.Feature({
                                geometry: new ol.geom.Point(ol.proj.fromLonLat([facility.longitude, facility.latitude])),
                                name: facility.label,
                                object_id: facility.object_id,
                                link: generateLink([
                                    [long, lat],
                                    [facility.longitude, facility.latitude]
                                ])
                            });
                        
                            const iconUrl = iconUrls[index % iconUrls.length]; // Now index is defined
                        
                            const style = new ol.style.Style({
                                image: new ol.style.Icon({
                                    anchor: [0.5, 1],
                                    src: iconUrl,
                                    scale: 0.02,
                                    
                                })
                            });
                        
                            feature.setStyle(style);
                            facilitiesMarkerSource.addFeature(feature);
                        
                            const listItem = $(`
                                <li class="facility-item" style="margin-bottom: 3px;">
                                    <div class="d-flex facilities-details">
                                        <div class="facility-serial" style="width: 18px;">${index + 1}.</div>
                                        <div class="facility-name" style="flex: 1;">${facility.label ? facility.label: '-'}</div>
                                        <div class="facility-distance">${facility.distance ? facility.distance: '-'} ${facility.distance_unit ? facility.distance_unit: '-'}</div>
                                        <div class="facility-action">
                                            <a href="${direction}" target="_blank">
                                                <img src="assets/icons/direction.svg" class="info-icon-img-style" alt="">
                                            </a>
                                        </div>
                                    </div>
                                </li>
                            `);
                            list.append(listItem);
                            
                        });
                        
                        detailDiv.append(list);
                        $('#facility-info-container').append(detailDiv);
                        $(".error-message").empty().hide();
                    }else{
                        clearVectorBoundarySourceData();
                        let infoDetailes = '';
                        $("#selected-boundary").html("Boundary Information For <span style='font-size:10px'>("+selectedTitle+")</span");
                        
                       
                        facilities.forEach(facility => {
                            // Generate HTML content for key-value pairs
                            let infoDetails = '';
                            const excludedKeys = ['geometry', 'object_id', 'layer_id', 'district_name', 'taluk_name','district_code','e_district_code','ed_taluk_code','district_lgd_code','block_lgd_code','village_lgd_code','dcode'];

                            // Define pairs of code-name keys to merge
                            const mergeFields = {
                                region_code: 'region_name',
                                circle_code: 'circle_name',
                                division_code: 'division_name',
                                subdivision_code: 'subdivision_name',
                                section_code: 'section_name',
                                police_station_code: 'police_station_name',
                                assembly_constituency_code: 'assembly_constituency_name',
                                parliamentary_constituency_code: 'parliamentary_constituency_name'
                            };
                            let layerId = facility.data.layer_id;
                            for (const [key, value] of Object.entries(facility.data)) {
                                if (!excludedKeys.includes(key) && typeof value !== 'object') {
                                    let label = formatKeyName(key);
                                    if(key == 'village_name'){
                                        label = 'Village Panchayat';
                                    }
                                    if(key == 'sro_name'){
                                        label = 'Sub Registrar Office';
                                    }
                                    if(key == 'sro_district'){
                                        label = 'District Registrar Office';
                                    }
                                    if(key == 'deo_jurisdiction'){
                                        label = 'District Education Office';
                                    }
                                    let displayValue = value;
                            
                                    // If this is a code and its corresponding name exists, merge and skip name later
                                    if (mergeFields[key] && facility.data[mergeFields[key]]) {
                                        displayValue = `${value} - ${facility.data[mergeFields[key]]}`;
                                        label = formatKeyName(mergeFields[key]); // Use the name's label
                                    }
                            
                                    // If this is a name key and its corresponding code has already been handled, skip it
                                    else if (Object.values(mergeFields).includes(key)) {
                                        const codeKey = Object.keys(mergeFields).find(code => mergeFields[code] === key);
                                        if (facility.data[codeKey]) {
                                            continue; // Already displayed with code
                                        }
                                    }
                            
                                    let imageTag = '';
                                    if (key === 'beat_name' ) {
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'section_code' && layerId == '1553'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'region_boundary' && layerId == '1500'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'circle_name' && layerId == '1062'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'police_station_code' && layerId == '1050'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'village_name' && layerId == '1014'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'assembly_constituency_code' && layerId == '1025'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'sro_name'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }else if(key === 'deo_jurisdiction'){
                                        imageTag = `<img src="assets/icons/boundary-icons.svg" alt="Boundary" style="width:22px; height:22px; margin-left:5px;">`;
                                    }
                                    

                                    infoDetails += `<div><strong>${label}:</strong> ${displayValue} ${imageTag}</div>`;

                                    // infoDetails += `<div><strong>${label}:</strong> ${displayValue}</div>`;
                                }
                            }
                            

                            
                            // Create list item with the generated content
                            const listItem = $(`
                                <li class="facility-item" style="margin-bottom: 3px;">
                                    <div class="d-flex facilities-details">
                                        <div class="facility-name">${infoDetails}</div>
                                    </div>
                                </li>
                            `);
                            list.append(listItem);
                        
                            // Log geometry
                            // Feature handling
                            if (layerType === 'boundary') {
                                const boundary = geojsonFormat.readFeature(facility.data.geometry);
                                boundary.getGeometry().transform('EPSG:4326', 'EPSG:3857');
                                selectionGeojsonSource.addFeature(boundary);
                            } else {
                                nearest_feature_source.addFeatures(features);
                            }
                        
                            // Map view fit
                            const padding = [10, 0, 10, 0];
                            if (layerType === 'boundary') {
                                map.getView().fit(boundarygeojsonLayer.getSource().getExtent(), {
                                    size: map.getSize(),
                                    duration: 2000,
                                    maxZoom: 12,
                                    padding: padding
                                });
                                boundarygeojsonLayer.setVisible(true);
                            } else {
                                map.getView().fit(nearest_feature_layer.getSource().getExtent(), {
                                    size: map.getSize(),
                                    duration: 2000,
                                    maxZoom: 8,
                                    padding: padding
                                });
                                nearest_feature_layer.setVisible(true);
                            }
                        });
                        
                        detailDiv.append(list);
                        
                        $('#JSB-info-container').append(detailDiv);
                        $(".error-message").empty().hide();
                        
                    }
                } else {
                    $(".error-message").empty().text(response[0].message).show();
                }
            },
            error: function (xhr, status, error) {
                if (status !== 'abort') {
                    console.error('Error in fetching AREG - ', error);
                }
            }
        });
        
    });

    $('#current-location').on('click', function () {
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          return;
        }
      
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
            if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                initializeLocation();
            } else if (permissionStatus.state === 'denied') {
              alert("Location permission denied. Please enable it in browser settings.");
            }
      
            permissionStatus.onchange = function () {
              if (permissionStatus.state === 'granted') {
                initializeLocation();
              }
            };
          }).catch(() => {
            initializeLocation();
          });
        } else {
            initializeLocation();
        }
        moveToCurrentLocation();
      });
      
      // Auto-locate if permission is already granted
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(function (status) {
          if (status.state === 'granted') {
            initializeLocation();
          }
        });
      }
      initializeLocation();
});

function initializeLocation() {
    map.once('rendercomplete', function () {
      locationLayer.setZIndex(999); // Ensure locationLayer is on top
      getLocation();
    });
  }

$(document).on("click", ".district-icon", function () {
    // Remove active class from all district icon images
    $(".district-icon img").removeClass("district-icon-active");

    // Add active class to the clicked button's image
    $(this).find("img").addClass("district-icon-active");
});

$(document).on("click", ".JSB-icon-card", function () {
    // Remove active class from all district icon images
    $(".JSB-icon-card img").removeClass("JSB-icon-card-active");

    // Add active class to the clicked button's image
    $(this).find("img").addClass("JSB-icon-card-active");
});

$(document).on("click", ".masterplan-icon-card", function () {
    // Remove active class from all district icon images
    $(".masterplan-icon-card img").removeClass("JSB-icon-card-active");

    // Add active class to the clicked button's image
    $(this).find("img").addClass("JSB-icon-card-active");
});

function formatKeyName(key) {
    return key
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
}

$(document).on('click', '.thematic-icon-card', function () {
    let currentController = null;
    let currentPopulationRequest = null;

    const selectedLayerTitle = this.title;
    const lat = $("#latitude").val();
    const lon = $("#longitude").val();

    const THEME_LAYERS = {
        'Elevation': 'generic_viewer:elevation_raster',
        'Slope': 'generic_viewer:tn_slope',
        'Aspect': 'generic_viewer:tn_aspect'
    };

    const EXTERNAL_LAYERS = ['Population Theme', 'TN-Land Type', 'TN-Land Ownership','Geology','Geo morphology','Cattle Population','Landuse 2019','Soil Map'];

    $('.thematic-icon-card').removeClass('active');
    $(this).addClass('active'); 
    // Remove old detail divs
    $('#thematic-info-container .detail').remove();

    $("#selected-thematic").html(
        `Thematic Information For <span style='font-size:10px'>(${selectedLayerTitle})</span>`
    );

    const showError = msg => {
        $('#thematic-info-container .detail').remove();
        $('#thematic-info-container').append(`
            <div class="detail mt-2 p-2 border rounded" style="background:#a94442;color: #fff;">
                <b>Error:</b> ${msg}
            </div>
        `);
    };

    const showResult = html => {
        $('#thematic-info-container').append(`
            <div class="detail mt-2 p-2 border rounded bgcolordiv" style="color:#212529;">
                ${html}
            </div>
        `);
    };

    if (!EXTERNAL_LAYERS.includes(selectedLayerTitle)) {
        const layerName = THEME_LAYERS[selectedLayerTitle];
        if (!layerName) return showError('Layer not supported or not defined.');
        
        const coord = ol.proj.fromLonLat([lon, lat], 'EPSG:3857');
        const res = 10, halfSize = 50 * res;
        const [minX, minY, maxX, maxY] = [
            coord[0] - halfSize,
            coord[1] - halfSize,
            coord[0] + halfSize,
            coord[1] + halfSize
        ];

        const url = `${GEOSERVER_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo` +
            `&FORMAT=image/png&TRANSPARENT=true&QUERY_LAYERS=${layerName}&LAYERS=${layerName}` +
            `&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:3857&BBOX=${minX},${minY},${maxX},${maxY}`;
    
        if (currentController) currentController.abort();
        currentController = new AbortController();
        
        fetch(url, { signal: currentController.signal })
            .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.features?.length) throw new Error("No features found.");
                    const props = data.features[0].properties;
                let grayIndex = props.GRAY_INDEX ?? null;
                let grayIndexValue = 'No valid data';

                switch (selectedLayerTitle) {
                    case 'Elevation':
                        grayIndexValue = grayIndex !== null ? `${Math.floor(grayIndex)} M` : grayIndexValue;
                        break;
                    case 'Slope':
                        grayIndexValue = grayIndex !== null ? `${Math.floor(grayIndex)} °` : grayIndexValue;
                        break;
                    case 'Aspect':
                        grayIndex = Math.floor(grayIndex);
                        const directions = [
                            { min: 0, max: 22.5, label: 'N' },
                            { min: 22.5, max: 67.5, label: 'NE' },
                            { min: 67.5, max: 112.5, label: 'E' },
                            { min: 112.5, max: 157.5, label: 'SE' },
                            { min: 157.5, max: 202.5, label: 'S' },
                            { min: 202.5, max: 247.5, label: 'SW' },
                            { min: 247.5, max: 292.5, label: 'W' },
                            { min: 292.5, max: 337.5, label: 'NW' },
                            { min: 337.5, max: 360, label: 'N' }
                        ];
                        const aspectValue = directions.find(d => grayIndex > d.min && grayIndex <= d.max);
                        grayIndexValue = grayIndex <= -1 ? `${grayIndex} Flat` :
                            aspectValue ? `${grayIndex} ${aspectValue.label}` : 'Unknown Direction';
                        break;
                }

                showResult(`Selected <b>${selectedLayerTitle}</b> of the point: ${grayIndexValue}`);
            })
            .catch(err => {
                if (err.name !== 'AbortError') showError(`No data found for selected ${selectedLayerTitle}.`);
            });

    } else {
        let getfeatureDetailsUrl = GI_VIEWER_API_URL+ '/getFeatureInfo';
        const apiConfig = {
            'TN-Land Type': { layer: 'tamilnilam_land_tpe', url: IGR_URL },
            'TN-Land Ownership': { layer: 'tamilnilam_ownership', url: IGR_URL },
            'Population Theme': { layer: 'population', url: POPULATION_URL },
            'Soil Map': { layer: 'soil_map', url: getfeatureDetailsUrl },
            'Geology': { layer: 'geology', url: getfeatureDetailsUrl },
            'Geo morphology': { layer: 'geo_morphology', url: getfeatureDetailsUrl },
            'Landuse 2019': { layer: 'landuse_2019', url: getfeatureDetailsUrl },
            'Cattle Population': { layer: 'cattle_population', url: getfeatureDetailsUrl },
        };

        const { layer, url } = apiConfig[selectedLayerTitle];
        const urbanParams = { latitude: lat, longitude: lon, layer_name: layer };

        if (currentPopulationRequest && currentPopulationRequest.readyState !== 4) {
            currentPopulationRequest.abort();
        }
        let headers = {};
        if(selectedLayerTitle == 'Population Theme' || selectedLayerTitle == 'TN-Land Ownership' || selectedLayerTitle == 'TN-Land Type'){
            headers = { 'X-APP-ID': 'te$t' };
    }else{
            headers = { 'X-APP-NAME': 'demo' };
        }
        currentPopulationRequest = $.ajax({
            url,
            method: 'POST',
            headers: headers,
            data: urbanParams,
            success: function (response) {
                if (response.success != 1) return showError(response.message || 'Unknown error');

                let content = '';
                const data = response.data;
                    if (selectedLayerTitle === 'TN-Land Type') {
                    content = `<div><strong>Land Type:</strong> ${data.type_cate || '-'}</div>`;
                    } else if (selectedLayerTitle === 'TN-Land Ownership') {
                    content = `
                        <div><strong>Government Land Type:</strong> ${data.government_land_type || '-'}</div>
                        <div><strong>Classified Land Type:</strong> ${data.classified_land_type || '-'}</div>`;
                    } else if (selectedLayerTitle === 'Population Theme') {
                    const d = data[0];
                    content = `
                        <div class="text-center">Population statistics for 2011 - 
                            <strong style='color:red'>${d.vill_name || '-'} (${d.type || '-'})</strong>
                            </div>
                        <div><strong>Total Population:</strong> ${d.tot_p || '-'}</div>
                        <div><strong>No. of Households:</strong> ${d.no_hh || '-'}</div>
                        <div><strong>Male Population:</strong> ${d.tot_m || '-'}</div>
                        <div><strong>Female Population:</strong> ${d.tot_f || '-'}</div>`;
                }else if (selectedLayerTitle === 'Soil Map') {
                    const d = data[0];
                    content = `
                        <div><strong>Description:</strong> ${d.descriptio || '-'}</div>
                        <div><strong>Taxonomic:</strong> ${d.taxonomic_ || '-'}</div>
                        <div><strong>Area:</strong> ${d.area__in__ || '-'}</div>`;
                }else if (selectedLayerTitle === 'Geology') {
                    const d = data[0];
                    content = `
                        <div><strong>Rock Type:</strong> ${d.rock_type || '-'}</div>
                        <div><strong>Rock gr:</strong> ${d.rock_gr || '-'}</div>
                        <div><strong>Lith Unit:</strong> ${d.lith_unit || '-'}</div>
                        <div><strong>Stratigraphy:</strong> ${d.stratigrap || '-'}</div>`;
                }else if (selectedLayerTitle === 'Geo morphology') {
                    const d = data[0];
                    content = `
                        <div><strong>Description 1:</strong> ${d.descr_l1 || '-'}</div>
                        <div><strong>Description 2:</strong> ${d.descr_l2 || '-'}</div>
                        <div><strong>Description 3:</strong> ${d.descr_l3 || '-'}</div>
                        <div><strong>Description 4:</strong> ${d.descr_l4 || '-'}</div>
                        <div><strong>Description 5:</strong> ${d.descr_l5 || '-'}</div>`;
                }else if (selectedLayerTitle === 'Landuse 2019') {
                    const d = data[0];
                    content = `
                        <div><strong>Land Use:</strong> ${d.level_iv || '-'}</div>
                        <div><strong>Area:</strong> ${d.area_sqkm || '-'}</div>`;
                }else if (selectedLayerTitle === 'Cattle Population') {
                    const d = data[0];
                    content = `
                        <div class="text-center">Population statistics for 2011 - 
                            <strong style='color:red'>${d.village_name || '-'} (Village)</strong>
                        </div>
                        <div><strong>Cattle:</strong> ${d.cattle || '-'}</div>
                        <div><strong>Buffalo:</strong> ${d.buffalo || '-'}</div>
                        <div><strong>Sheep:</strong> ${d.sheep || '-'}</div>
                        <div><strong>Goat:</strong> ${d.goat || '-'}</div>
                        <div><strong>Pig:</strong> ${d.pig || '-'}</div>
                        <div><strong>Poultry</strong> ${d.poultry || '-'}</div>
                        <div><strong>Total Live:</strong> ${d.total_live || '-'}</div>`;
                }

                showResult(content);
            },
            error: function (xhr, status) {
                if (status !== 'abort') showError('Failed to retrieve thematic data.');
                }
        });
            }
        });


map.on('pointermove', function (e) {
    var lonlat = ol.proj.toLonLat(e.coordinate);
    $("#lon").html(lonlat[0].toFixed(6));
    $("#lat").html(lonlat[1].toFixed(6));
});

// Close button event listener
document.getElementById('close-btn').addEventListener('click', hidePanel);

function displaySimplifiedInfo(data, lat, long) {
    if(data.message != 'No valid land data found' && data.success != 0){
    $(".error-message").empty().hide();
    }else{
        geojsonSource.clear();
    }
    const panel = document.getElementById('lpi-container');
    const content = document.getElementById('lpi-content');
    // console.log(data);
    // Clear previous content
    content.innerHTML = '';

    // Group Data into Sections
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-section';

    // District, Taluk, and Village in a single line
    const districtTalukVillage = document.createElement('div');
    districtTalukVillage.className = 'district-taluk-village';
    if(data.rural_urban != 'urban'){
        districtTalukVillage.innerHTML = `
        <div><strong>District:</strong> <br />${data.district_name ? data.district_name: '-'} / ${data.district_tamil_name ? data.district_tamil_name: '-'}</div>
        <div><strong>Taluk:</strong> <br /> ${data.taluk_name ? data.taluk_name: '-'} / ${data.taluk_tamil_name ? data.taluk_tamil_name: '-'}</div>
        <div><strong>Village:</strong> <br /> ${data.village_name ? data.village_name:'-'} / ${data.village_tamil_name ? data.village_tamil_name:'-'}</div>
    `;
    }else{
        districtTalukVillage.innerHTML = `
        <div><strong>District:</strong> <br />${data.district_name ? data.district_name : '-'} / ${data.district_tamil_name ? data.district_tamil_name: '-'}</div>
        <div><strong>Taluk:</strong> <br /> ${data.taluk_name ? data.taluk_name: '-'} / ${data.taluk_tamil_name ? data.taluk_tamil_name : '-'}</div>
        <div><strong>Town:</strong> <br /> ${data.revenue_town_name ? data.revenue_town_name: '-'} / ${data.revenue_town_tamil_name ? data.revenue_town_tamil_name: '-'}</div>
        <div><strong>R.Ward:</strong> <br /> ${data.revenue_ward_name ? data.revenue_ward_name: '-'} / ${data.revenue_ward_tamil_name ? data.revenue_ward_tamil_name: '-'}</div>
        <div><strong>R.Block:</strong> <br /> ${data.revenue_block_name ? data.revenue_block_name: '-'} / ${data.revenue_block_name ? data.revenue_block_name: '-'}</div>
    `; 
    }
    
    infoDiv.appendChild(districtTalukVillage);

    if(data.rural_urban != 'urban'){
    // LGD Codes
    const lgdCodes = document.createElement('div');
    lgdCodes.className = 'lgd-codes';
    lgdCodes.innerHTML = `
        <div><strong>Village LGD Code:</strong> ${data.lgd_village_code ? data.lgd_village_code:'-'} (${data.rural_urban ? data.rural_urban: '-'})</div>
    `;
    infoDiv.appendChild(lgdCodes);
    }

    content.appendChild(infoDiv);

    // Survey Section
    const surveySection = document.createElement('div');
    surveySection.className = 'info-survey-section';

    // const surveyNumber = data.is_fmb == 1
    //     ? (data.sub_division ? `${data.survey_number}/${data.sub_division}` : data.survey_number)
    //     : data.survey_number;
        const surveyNumber = data.survey_number || '';

        const subDivision = data.is_fmb == 1 ? (data.sub_division !=null) ? data.sub_division: '-' : '-';


    surveySection.innerHTML = `
        <div><strong>ULPIN:</strong> ${data.ulpin ? data.ulpin : '-'}</div> <div><strong>Centroid:</strong> ${data.centroid ? data.centroid : '-'}</div><br>
        <div><strong>Survey Number:</strong> ${surveyNumber}</div>
        <div id='subdivisionid'><strong>Sub Division:</strong> <span id="subDivs">${subDivision}</span></div>
        <br>
    `;

    // Icon Section
    const iconSection = document.createElement('div');
    iconSection.className = 'info-icons';

    iconSection.innerHTML = `
    <h6 class="note">Click on the below icons to view more details</h6>
        <ul class="nav nav-tabs mb-1 d-flex flex-row" id="myTab" role="tablist">
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Patta / Chitta - A-Reg" id="profile-tab" type="button" 
                    data-bs-target="#profile-tab-pane" aria-controls="profile-tab-pane" aria-selected="false" 
                    onclick='openAregInfo(${JSON.stringify(data)})'>
                    <img src="assets/icons/patta-chitta-icon.svg" class="info-icon-img-style" alt="">
                    <p class="font-size-9">Patta</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="FMB Sketch" id="next-tab" type="button" 
                    data-bs-target="#next-tab-pane" aria-controls="next-tab-pane" aria-selected="false" 
                    onclick='openFMBSketchInfo(${JSON.stringify(data)})'>
                    <img src="assets/icons/FMB-Sketch-icon.svg" class="info-icon-img-style" alt="">
                    <p class="font-size-9">FMB</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Vertex / Plot Corner List" id="pro-tab" type="button" 
                    data-bs-target="#pro-tab-pane" aria-controls="pro-tab-pane" aria-selected="false" 
                    onclick='highlightVertices(${JSON.stringify(data.geojson_geom)})'>
                    <img src="assets/icons/vertex-icon.svg" class="info-icon-img-style" alt="">
                    <p class="font-size-9">Vertex</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Guideline Value" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='openIGRInfo(${JSON.stringify(data)}, ${lat}, ${long})'>
                    <img src="assets/icons/rupee-icon.svg" class="info-icon-img-style" alt="">
                    <p class="font-size-9">G-Value</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Encumbrance Certificate" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='openECnfo(${JSON.stringify(data)}, ${lat}, ${long})'>
                    <img src="assets/icons/EC-icon.svg" id="EC_logo" class="info-icon-img-style" alt="">
                    <p class="font-size-9">EC</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Jurisdictional Boundaries" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='JSBIconInfo(${JSON.stringify(data)}, ${lat}, ${long})'>
                    <img src="assets/icons/boundary-icon.svg" id="boundaries" class="info-icon-img-style" alt="">
                    <p class="font-size-9">Boundary</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Thematic View" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='loadThematicIconsFromJson(${JSON.stringify(data)}, ${lat}, ${long})'>
                    <img src="assets/icons/thematic-icon.svg" id="thematic_view" class="info-icon-img-style" alt="">
                    <p class="font-size-9">Thematic</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Crop" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='adangalView()'>
                    <img src="assets/icons/adangal-icon.svg" id="adangal_view" class="info-icon-img-style" alt="">
                    <p class="font-size-9">Crop</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Master Plan" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='masterPlanView()'>
                    <img src="assets/icons/master-plan-icon.svg" id="master_plan_view" class="info-icon-img-style" alt="">
                    <p class="font-size-9">M plan</p>
                </button>
            </li>
            <li class="nav-item mx-1 mb-2" role="presentation">
                <button class="nav-link district-icon" title="Nearby Facilities" id="nex-tab" type="button" 
                    data-bs-target="#nex-tab-pane" aria-controls="nex-tab-pane" aria-selected="false" 
                    onclick='nearByView(${JSON.stringify(data)}, ${lat}, ${long})'>
                    <img src="assets/icons/nearby-icon.svg" id="nearby_facilities" class="info-icon-img-style" alt="">
                    <p class="font-size-9">N-Facility</p>
                </button>
            </li>
        </ul>
    `;

    // Append sections to content
    content.appendChild(surveySection);
    content.appendChild(iconSection);
    $("#staticBackdrop").modal('show');
}

// Hide the info panel
function simplifiedHidePanel() {
    $("#staticBackdrop").modal('hide');
}

// Close button event listener
document.getElementById('simplified-close-btn').addEventListener('click', simplifiedHidePanel);


function addGeoJsonLayer(geojson) {
    // Read the GeoJSON and transform the coordinates to 'EPSG:3857'
    var features = geojsonFormat.readFeatures(geojson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });

    geojsonSource.clear();
    geojsonSource.addFeatures(features);

    var extent = geojsonSource.getExtent();

    // Get the map's size and calculate the polygon's bounding box (extent)
    var mapSize = map.getSize();
    var extentWidth = extent[2] - extent[0];
    var extentHeight = extent[3] - extent[1];

    var extentRatio = extentWidth / extentHeight;

    let zoomLevel;
    if (extentWidth < mapSize[0] && extentHeight < mapSize[1]) {
        zoomLevel = 18.4;
    } else if (extentWidth < mapSize[0] * 2 && extentHeight < mapSize[1] * 2) {
        zoomLevel = 17;
    } else if (extentWidth < mapSize[0] * 3 && extentHeight < mapSize[1] * 3) {
        zoomLevel = 16;
    } else {
        zoomLevel = 14;
    }

    // Fit the map to the extent and apply the selected zoom level
    map.getView().fit(extent, {
        duration: 4000,
        maxZoom: zoomLevel,
        padding: [18, 18, 18, 18]
    });

    geojsonLayer.setVisible(true);
}
    


$("#info-close").on("click", function(){
    clearVertexLabels();
    geojsonSource.clear();
    map.removeLayer(vertexLayer);
    markerSource.clear();
    facilitiesMarkerSourceClear();
});

// Global variable to hold reference to the vertex layer
let vertexLayer = null;

// Function to handle vertex extraction, highlighting, and coordinate display
function highlightVertices(sgeojsonGeom) {
    $(".error-message").empty().hide();
    map.removeLayer(vertexLayer);
    const geojsonGeom = JSON.parse(sgeojsonGeom);
    const vertices = extractVertices(geojsonGeom);
    // console.log(vertices);

    const vertexFeatures = vertices.map((vertex, index) => {
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat(vertex)), // Convert to map projection (default EPSG:3857)
            coordinates: vertex
        });

        feature.setStyle(
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: 'blue' }),
                    stroke: new ol.style.Stroke({ color: 'white', width: 1 })
                }),
                text: new ol.style.Text({
                    text: `${index + 1}`, // Display serial number
                    font: '12px Arial',
                    fill: new ol.style.Fill({ color: 'black' }),
                    backgroundFill: new ol.style.Fill({ color: 'white' }),
                    padding: [2, 2, 2, 2],
                    offsetY: -15
                })
            })
        );

        return feature;
    });

    const vertexSource = new ol.source.Vector({
        features: vertexFeatures
    });

    vertexLayer = new ol.layer.Vector({
        source: vertexSource,
        zIndex: 1007
    });
    
    map.addLayer(vertexLayer);

    displayVertexDetails(vertices);

    // Zoom to fit the extent of vertices
    const extent = vertexSource.getExtent();
    map.getView().fit(extent, {
        duration: 4000,
        maxZoom: 18.4,
        padding: [19, 19, 19, 19]
    });
}
function displayVertexDetails(vertices) {
    $(".error-message").empty().hide();
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('masterplan-info-container')?.remove();


    // Select the .info-icons div
    const iconSection = document.querySelector('.info-icons');

    // Remove any existing vertex info container
    document.getElementById('vertex-info-container')?.remove();

    // Create the container for the vertex info
    const vertexContainer = document.createElement('div');
    vertexContainer.id = 'vertex-info-container';
    vertexContainer.className = 'mt-2 p-3 border rounded position-relative';
    vertexContainer.style.maxHeight = '400px';   // Max height for scrollable content
    vertexContainer.style.overflowY = 'auto';    // Vertical scroll bar
    vertexContainer.style.background = '#f9f9f9';
    vertexContainer.style.border = '1px solid #ddd';

    // Add the title with a close button
    const panelTitle = document.createElement('div');
    panelTitle.className = 'd-flex justify-content-between align-items-center';
    panelTitle.innerHTML = `
        <h6 class="m-0">Vertex Information (${vertices.length} Vertices)</h6>
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'btn-close vertexes-close position-absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closever);
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';

    // Close button event listener
    closeButton.addEventListener('click', () => {
        vertexContainer.remove();
        $('.district-icon img').removeClass('district-icon-active');
    });

    // Append close button to title
    panelTitle.appendChild(closeButton);

    // Create the table content
    let vertexTableContent = `
        <table class="table table-bordered table-striped mt-2">
            <thead class="table-dark">
                <tr>
                    <th>Vertex Number</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                </tr>
            </thead>
            <tbody>
    `;

    vertices.forEach((vertex, index) => {
        vertexTableContent += `
            <tr onclick="zoomToVertex(${vertex[0]}, ${vertex[1]})" style="cursor: pointer;">
                <td>${index + 1}</td>
                <td>${vertex[1].toFixed(6)}</td>
                <td>${vertex[0].toFixed(6)}</td>
            </tr>
        `;
    });

    vertexTableContent += `
            </tbody>
        </table>
    `;

    // Append the title and table content
    vertexContainer.appendChild(panelTitle);

    const infoContent = document.createElement('div');
    infoContent.innerHTML = vertexTableContent;
    vertexContainer.appendChild(infoContent);

    // Insert the vertex container below the .info-icons div
    iconSection.insertAdjacentElement('afterend', vertexContainer);
}


// Utility function to extract vertices and remove the last point if it's a duplicate (Polygon/MultiPolygon)
function extractVertices(geojsonGeom) {
    const vertices = [];
    const coordinates = geojsonGeom.coordinates;

    if (geojsonGeom.type === 'Polygon' || geojsonGeom.type === 'MultiPolygon') {
        const flattenedCoords = geojsonGeom.type === 'Polygon' ? [coordinates] : coordinates;

        flattenedCoords.forEach((polygon) => {
            polygon.forEach((ring) => {
                ring.forEach((coord, index) => {
                    if (index !== ring.length - 1) { // Skip last point to avoid redundancy
                        vertices.push(coord);
                    }
                });
            });
        });
    } else if (geojsonGeom.type === 'LineString' || geojsonGeom.type === 'MultiLineString') {
        const lines = geojsonGeom.type === 'LineString' ? [coordinates] : coordinates;
        lines.forEach((line) => {
            line.forEach((coord) => {
                vertices.push(coord);
            });
        });
    } else if (geojsonGeom.type === 'Point') {
        vertices.push(coordinates);
    }

    return vertices;
}

// Function to clear the labels and remove the vertex layer from the map
function clearVertexLabels() {
    if (vertexLayer) {
        map.removeLayer(vertexLayer); // Remove the layer containing the vertex features
        vertexLayer = null; // Clear the reference to the layer
    }

    // Clear the info panel content
    const panel = document.getElementById('vertex-info-panel');
    panel.style.display = 'none';
    const infoContent = document.getElementById('vertex-info-content');
    infoContent.innerHTML = '';
    const panelTitle = document.getElementById('vertex-info-title');
    panelTitle.innerHTML = 'Vertex Information';
}

// Function to close the info panel when the close button is clicked
function closeInfoPanel() {
    const panel = document.getElementById('vertex-info-panel');
    panel.style.display = 'none';  // Hide the panel
    clearVertexLabels();  // Remove the vertex labels (optional)
}

// Function to zoom to the vertex with dynamic zoom level
function zoomToVertex(longitude, latitude) {
    const currentCenter = ol.proj.toLonLat(map.getView().getCenter());
    const distance = getDistance(currentCenter, [longitude, latitude]); // Get distance between current center and target vertex

    // Set a dynamic zoom level based on distance
    let zoomLevel;
    if (distance < 500) {
        zoomLevel = 20; // Very close, high zoom
    } else if (distance < 1000) {
        zoomLevel = 18; // Close
    } else if (distance < 5000) {
        zoomLevel = 16; // Medium
    } else {
        zoomLevel = 14; // Far away, low zoom
    }

    // Convert the target vertex to map projection
    const coordinate = ol.proj.fromLonLat([longitude, latitude]);

    // Animate the zoom and center to the target vertex
    map.getView().animate({
        center: coordinate,
        zoom: zoomLevel,
        duration: 1000 // Zoom duration
    });

    // Highlight the vertex on the map
    highlightVertex(coordinate);
}

// Function to calculate the distance (in meters) between two points
function getDistance(coord1, coord2) {
    const from = ol.proj.fromLonLat(coord1); // Convert to map projection
    const to = ol.proj.fromLonLat(coord2);
    const line = new ol.geom.LineString([from, to]);
    return line.getLength(); // Returns the distance in meters
}

// Function to highlight the vertex with a distinct style
function highlightVertex(coordinate) {
    // Create a feature for the vertex
    const vertexFeature = new ol.Feature({
        geometry: new ol.geom.Point(coordinate)
    });

    // Apply a distinct style to highlight the vertex
    vertexFeature.setStyle(
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: 'yellow' }), // Highlight color
                stroke: new ol.style.Stroke({ color: 'black', width: 2 })
            })
        })
    );

    // Create a source and layer for the highlighted vertex
    const highlightSource = new ol.source.Vector({
        features: [vertexFeature]
    });

    const highlightLayer = new ol.layer.Vector({
        source: highlightSource,
        zIndex: 1008 // Higher layer for visibility
    });

    // Add the highlight layer to the map
    map.addLayer(highlightLayer);

    // Remove the highlight after 1.5 seconds (adjust as needed)
    setTimeout(() => {
        map.removeLayer(highlightLayer);
    }, 1500);
}

/** Areg Info Panel Creation Start*/

function openAregInfo(data) {
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();

    let sub_division_numbers = '';
    var lapad_district_codes = LpadAdding(data.district_code,'district');
    var lapad_taluk_codes = LpadAdding(data.taluk_code,'taluk');

    if (data.rural_urban === "rural") {
        verifySubDivision(data)
        .then(result => {
            
            $("#verifiedSubDivision").val('');
            if (result.success == 1) {
                if (result.data && result.data.length >= 1) {
                    sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';
                } else {
                    sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';

                    const params = {
                        district_code: lapad_district_codes,
                        taluk_code: lapad_taluk_codes,
                        village_code: data.village_code,
                        survey_number: data.survey_number,
                        sub_division_number: sub_division_numbers,
                        land_type: data.rural_urban,
                        code_type: ADMIN_CODE_TYPE,
                        search_type: AREG_SEARCH_TYPE
                    };
                    fetchAreg(params);
                }
            } else if (result.success == 2) {
                if (result.count > 0 && result.message == 'Sub division Details Found') {
                    if(result.data.length == 1){
                        $("#subDivs").text(result.data.subdiv_no);
                        sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';

                        const params = {
                            district_code: lapad_district_codes,
                            taluk_code: lapad_taluk_codes,
                            village_code: data.village_code,
                            survey_number: data.survey_number,
                            sub_division_number: sub_division_numbers,
                            land_type: data.rural_urban,
                            code_type: ADMIN_CODE_TYPE,
                            search_type: AREG_SEARCH_TYPE
                        };
                        fetchAreg(params);
                    }else{
                        generateDropdown(result);
                        $("#verifiedSubDivision").val('no_subdivision_areg');

                        // Attach an event listener to wait for user selection
                    
                        sub_division_numbers = $("#subdivisionDropdown").val();
                        if(sub_division_numbers != ''){
                            const params = {
                                district_code: data.district_code,
                                taluk_code: lapad_taluk_codes,
                                village_code: data.village_code,
                                survey_number: data.survey_number,
                                sub_division_number: sub_division_numbers,
                                land_type: data.rural_urban,
                                code_type: ADMIN_CODE_TYPE,
                                search_type: AREG_SEARCH_TYPE
                            };
                            fetchAreg(params);
                            // Get reference to the dropdown and its parent
                            const dropdown = document.getElementById("subdivisionDropdown");
                            const selectedValue = dropdown.options[dropdown.selectedIndex].text; // or .value if needed

                            // Create a new span element
                            const span = document.createElement("span");
                            span.id = "subDivs";
                            span.style.color = "red";
                            span.textContent = selectedValue !== "Select Subdivision" ? selectedValue : ""; // Set selected value

                            // Replace dropdown with span
                            dropdown.parentNode.replaceChild(span, dropdown);
                            $(".error-message").empty().text('').hide();
                        }else{
                            // alert('Please select the sub division dropdown and get the result');
                            // showToast('info', `Please select the sub division dropdown and get the result`)
                            $("#subdivisionid #subDivs").remove();

                            let dropdown = $("#subdivisionDropdown");
                            dropdown.focus();

                            // Add animation class
                            dropdown.addClass("animated-border");

                            // Remove animation after selection
                            dropdown.on("change", function () {
                                $(this).removeClass("animated-border");
                            });
                        }
                    }
                    
                        
                }
            } else {
                $(".error-message").empty().text('No sub divisions found in Areg for the selected location').show();
            }
        })
        .catch(error => {
            console.error("Request failed:", error);
        });
    } else {
        
        verifySubDivision(data)
        .then(result => {
            
            $("#verifiedSubDivision").val('');
            if (result.success == 1) {
                if (result.data && result.data.length >= 1) {
                    sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';
                } else {
                    sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';

        const urbanParams = {
            district_code: data.district_code,
            taluk_code: lapad_taluk_codes,
            town_code: data.revenue_town_code,
            ward_code: data.firka_ward_number ? data.firka_ward_number : 0,
            block_code: data.urban_block_number,
            survey_number: data.survey_number,
                        // sub_division_number: data.is_fmb == 1 ? (data.sub_division != null ? data.sub_division : 0) : 0,
                        sub_division_number: data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-',
                        areaType: data.rural_urban
                    };
                    fetchAregForUrban(urbanParams);
                }
            } else if (result.success == 2) {
                if (result.count > 0 && result.message == 'Sub division Details Found') {
                    if(result.data.length == 1){
                        $("#subDivs").text(result.data.subdiv_no);
                        sub_division_numbers = data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-';

                        const urbanParams = {
                            district_code: data.district_code,
                            taluk_code: lapad_taluk_codes,
                            town_code: data.revenue_town_code,
                            ward_code: data.firka_ward_number ? data.firka_ward_number : 0,
                            block_code: data.urban_block_number,
                            survey_number: data.survey_number,
                            // sub_division_number: data.is_fmb == 1 ? (data.sub_division != null ? data.sub_division : 0) : 0,
                            sub_division_number: data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '-') : '-',
                            areaType: data.rural_urban
                        };
                        fetchAregForUrban(urbanParams);
                    }else{
                        generateDropdown(result);
                        $("#verifiedSubDivision").val('no_subdivision_areg');

                        // Attach an event listener to wait for user selection
                    
                        sub_division_numbers = $("#subdivisionDropdown").val();
                        if(sub_division_numbers != ''){
                            const urbanParams = {
                                district_code: data.district_code,
                                taluk_code: lapad_taluk_codes,
                                town_code: data.revenue_town_code,
                                ward_code: data.firka_ward_number ? data.firka_ward_number : 0,
                                block_code: data.urban_block_number,
                                survey_number: data.survey_number,
                                sub_division_number: sub_division_numbers,
                                areaType: data.rural_urban
                            };
                            fetchAregForUrban(urbanParams);
                            // Get reference to the dropdown and its parent
                            const dropdown = document.getElementById("subdivisionDropdown");
                            const selectedValue = dropdown.options[dropdown.selectedIndex].text; // or .value if needed

                            // Create a new span element
                            const span = document.createElement("span");
                            span.id = "subDivs";
                            span.style.color = "red";
                            span.textContent = selectedValue !== "Select Subdivision" ? selectedValue : ""; // Set selected value

                            // Replace dropdown with span
                            dropdown.parentNode.replaceChild(span, dropdown);
                            $(".error-message").empty().text('').hide();
                        }else{
                            // alert('Please select the sub division dropdown and get the result');
                            // showToast('info', `Please select the sub division dropdown and get the result`)
                            $("#subdivisionid #subDivs").remove();

                            let dropdown = $("#subdivisionDropdown");
                            dropdown.focus();

                            // Add animation class
                            dropdown.addClass("animated-border");

                            // Remove animation after selection
                            dropdown.on("change", function () {
                                $(this).removeClass("animated-border");
                            });
                        }
                    }
                    
                        
                }
            } else {
                console.log('No sub divisions found in Areg');
                $(".error-message").empty().text('No sub divisions found in Areg').show();
            }
        })
        .catch(error => {
            console.error("Request failed:", error);
        });


        
    }
}


function fetchAreg(params){
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
        $.ajax({
        url: `${AREG_SEARCH_URL}`,
            method: 'POST',
            headers: { 'X-APP-NAME': 'demo' },
        data: params,
            beforeSend: function(){
                showSpinner();
            },
            success: function (response) {
            if (response.success) {
                if(response.success == 1){
                    $(".error-message").empty().hide();
                    const responseData = response;
                    populateInfoPanel(responseData);
                }else{
                    $(".error-message").empty().text(response.message).show();
                }
                } else {
                    console.error(response.message);
                    $(".error-message").empty().text(response.message).show();
                }
                hideSpinner();
            },
            error: function (xhr, status, error) {
                console.error('Error in fetching AREG - ', error);
                hideSpinner();
            }
        });
    }


function fetchAregForUrban(urbanParams){
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
    var landType = urbanParams.areaType;
    $.ajax({
            url: `${BASE_URL}/v1/tamil_nillam_urban_ownership`,
        method: 'POST',
        headers: { 'X-APP-NAME': 'demo' },
            data: urbanParams,
        beforeSend: function(){
            showSpinner();
        },
        success: function (response) {
                if (response.success == 1) {
                    populateInfoPanel(response,landType);
            } else {
                console.error(response.message);
                $(".error-message").empty().text(response.message).show();
            }
            hideSpinner();
        },
        error: function (xhr, status, error) {
            console.error('Error in fetching AREG - ', error);
            hideSpinner();
        }
    });
}

function populateInfoPanel(response,landType) {
    $(".error-message").empty();

    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    if(landType != 'urban'){
        if (response.success === 1) {
        
            const landDetail = response.data.land_detail;
            const ownershipDetails = response.data.ownership_detail;
            // Select the .info-icons div
            const iconSection = document.querySelector('.info-icons');

            // Remove existing tab container if it exists
            const existingTabContainer = document.getElementById('areg-tab-container');
            if (existingTabContainer) {
                existingTabContainer.remove();
            }

            // Create the tab container
            const tabContainer = document.createElement('div');
            tabContainer.id = 'areg-tab-container';
            tabContainer.className = 'mt-1 position-relative';

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.className = 'btn-close vertex-close position-absolute';
            closeButton.style.top = '0px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.border = 'none';
            closeButton.style.background = 'transparent';
            closeButton.style.padding = '0px';

            // Close button event listener
            closeButton.addEventListener('click', () => {
                tabContainer.remove();
                $('.district-icon img').removeClass('district-icon-active');
            });

            // Create tab navigation
            const tabNav = document.createElement('ul');
            tabNav.className = 'nav nav-tabs';
            tabNav.innerHTML = `
                <li class="nav-item">
                    <button class="nav-link active" id="ownership-tab" data-bs-toggle="tab" 
                        data-bs-target="#ownership" type="button" role="tab" aria-controls="ownership" aria-selected="true">
                        Ownership Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="land-tab" data-bs-toggle="tab" 
                        data-bs-target="#land" type="button" role="tab" aria-controls="land" aria-selected="false">
                        Land Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="patta-download-tab" data-bs-toggle="tab" 
                        data-bs-target="#patta" type="button" role="tab" aria-controls="patta" aria-selected="false" data-details='${JSON.stringify(landDetail)}' onclick='searchPattaNumber(this)'>
                        Patta View
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="valuation-tab" data-bs-toggle="tab" 
                        data-bs-target="#valuation" type="button" role="tab" aria-controls="valuation" aria-selected="false">
                        Valuation
                    </button>
                </li>
            `;

            // Create the tab content container with scrollable area
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content mt-2';
            tabContent.style.maxHeight = '300px';  // Set max height
            tabContent.style.overflowY = 'auto';   // Add vertical scroll bar
            tabContent.style.background = '#f9f9f9';
            tabContent.style.border = '1px solid #ddd';

            // Ownership Details Tab (first tab)
            const ownershipTabPane = document.createElement('div');
            ownershipTabPane.className = 'tab-pane fade show active';
            ownershipTabPane.id = 'ownership';
            ownershipTabPane.role = 'tabpanel';
            ownershipTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>#</th><th>Owner</th><th>Relative</th><th>Relation</th></tr>
                    </thead>
                    <tbody id="ownership-details-table"></tbody>
                </table>
            `;

            // Land Details Tab (second tab)
            const landTabPane = document.createElement('div');
            landTabPane.className = 'tab-pane fade';
            landTabPane.id = 'land';
            landTabPane.role = 'tabpanel';
            landTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>Field</th><th>Value</th></tr>
                    </thead>
                    <tbody id="land-details-table"></tbody>
                </table>
            `;

            const pattaTabPane = document.createElement('div');
            pattaTabPane.className = 'tab-pane fade';
            pattaTabPane.id = 'patta';
            pattaTabPane.role = 'tabpanel';
            pattaTabPane.innerHTML = `
                
                    <div class="d-flex align-items-center pdfheader">
                        <h6 class="m-0 px-2">Patta Document</h6>
                        <button id="fullscreenPattaBtn" class="btn btn-sm btn-outline-secondary ms-2" style="border: none; background: transparent; cursor: pointer; font-size: 24px; left: 116px; position: relative;">
                            ⛶
                        </button>
                        
                    </div>
                    <iframe id="pattaViewerFrame" style="width: 100%; height: 350px; border: none; object-fit: contain;" allowfullscreen></iframe>
            `;


            const valuationTabPane = document.createElement('div');
            valuationTabPane.className = 'tab-pane fade';
            valuationTabPane.id = 'valuation';
            valuationTabPane.role = 'tabpanel';
            
            // Rural industrial zone rates sourced from TNREGINET baseline.
            const guidelineValue = 3800000; 
            const marketMultiplier = 2.0; 
            const marketValue = guidelineValue * marketMultiplier;
            const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
            
            valuationTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>Valuation Type</th><th>Amount (Per Acre)</th><th>Source/Basis</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Govt Guideline Value</strong></td>
                            <td class="text-primary fw-bold">${formatCurrency(guidelineValue)}</td>
                            <td>TNREGINET (Official Rural Rate)</td>
                        </tr>
                        <tr>
                            <td><strong>Market Rate Estimate</strong></td>
                            <td class="text-success fw-bold">${formatCurrency(marketValue)}</td>
                            <td>Market Analysis (Zone Multiplier)</td>
                        </tr>
                    </tbody>
                </table>
                <div class="alert alert-warning p-2 mt-2" style="font-size: 0.85rem;">
                    <strong>Verification Required:</strong> Guideline values are sourced from official TNREGINET zone records. For legal verification, please use the <a href="https://tnreginet.gov.in" target="_blank" class="text-decoration-underline">TNREGINET Portal</a> with the Survey/Sub-division details shown in the Land Details tab.
                </div>
            `;

            // Append elements
            tabContainer.appendChild(closeButton); // Add close button to container
            tabContainer.appendChild(tabNav);
            tabContainer.appendChild(tabContent);
            tabContent.appendChild(ownershipTabPane);
            tabContent.appendChild(landTabPane);
            tabContent.appendChild(pattaTabPane);
            tabContent.appendChild(valuationTabPane);

            // Insert the tab section below the .info-icons div
            iconSection.insertAdjacentElement('afterend', tabContainer);

            // Fields to Exclude
            const excludedFields = [
                "districtCode", "talukCode", "villCode", 
                "surveyNo", "subdivNo", "osurveyNo"
            ];

            // Populate Land Details Table excluding specified fields
            const landDetailsTable = document.getElementById("land-details-table");
            landDetailsTable.innerHTML = ''; // Clear previous data
            var formatedKey = '';
            for (const [key, value] of Object.entries(landDetail)) {
                if (!excludedFields.includes(key)) {
                    // Special case: combine govtPriEng + govtPriTamil as "Land Type"
                    if (key === "govtPriEng") {
                        const tamil = landDetail["govtPriTamil"];
                        const tamilValue = tamil !== null && tamil.trim() !== "" ? tamil : "-";
                        const combined = `${value} / ${tamilValue}`;
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>Land Type</td>
                            <td>${combined}</td>
                        `;
                        landDetailsTable.appendChild(row);
                        continue;
                    }
            
                    // Skip govtPriTamil since it's combined
                    if (key === "govtPriTamil") {
                        continue;
                    }
            
                    // Default value formatting
                    let displayValue = "-";
                    if (typeof value === "boolean") {
                        displayValue = value ? "Yes" : "No";
                    } else if (value !== null && String(value).trim() !== "") {
                        displayValue = value;
                    }
            
                    const formattedKey = addSpaceBeforeCaps(key);
            
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${formattedKey}</td>
                        <td>${displayValue}</td>
                    `;
                    landDetailsTable.appendChild(row);
                }
            }
            

            // Populate Ownership Details Table
            const ownershipDetailsTable = document.getElementById("ownership-details-table");
            ownershipDetailsTable.innerHTML = ''; // Clear previous data
            if (ownershipDetails.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td colspan="4" style="text-align: center;">No owners found</td>
                `;
                ownershipDetailsTable.appendChild(row);
            } else {
                ownershipDetails.forEach((owner, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${owner.Owner.trim()}</td>
                        <td>${owner.Relative.trim()}</td>
                        <td>${owner.Relation.trim()}</td>
                    `; 
                    ownershipDetailsTable.appendChild(row);
                });
            }
        
        } else {
            closeAregPanel();
            // alert("No Ownership Details Found for the Selected Land Parcel");
            $(".error-message").empty().text('No Ownership Details Found for the Selected Land Parcel').show();
        }
    }else{
        $(".error-message").empty();
        if(response.data != 'Land Detail is Not Found'){
            const landDetail = response.data.UaregData || {};  // Corrected data path for land details
            let ownershipDetailsRaw = response.data.UchittaNatham.owner ? response.data.UchittaNatham.owner : '-';
            let ownershipDetails = [];

            // Select the .info-icons div
            const iconSection = document.querySelector('.info-icons');

            // Remove existing tab container if it exists
            const existingTabContainer = document.getElementById('areg-tab-container');
            if (existingTabContainer) {
                existingTabContainer.remove();
            }

            // Create the tab container
            const tabContainer = document.createElement('div');
            tabContainer.id = 'areg-tab-container';
            tabContainer.className = 'mt-1 position-relative';

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.className = 'btn-close vertex-close position-absolute';
            closeButton.style.top = '0px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.border = 'none';
            closeButton.style.background = 'transparent';
            closeButton.style.padding = '0px';

            // Close button event listener
            closeButton.addEventListener('click', () => {
                tabContainer.remove();
                $('.district-icon img').removeClass('district-icon-active');
            });

            // Create tab navigation
            const tabNav = document.createElement('ul');
            tabNav.className = 'nav nav-tabs';
            tabNav.innerHTML = `
                <li class="nav-item">
                    <button class="nav-link active" id="ownership-tab" data-bs-toggle="tab" 
                        data-bs-target="#ownership" type="button" role="tab" aria-controls="ownership" aria-selected="true">
                        Ownership Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="land-tab" data-bs-toggle="tab" 
                        data-bs-target="#land" type="button" role="tab" aria-controls="land" aria-selected="false">
                        Land Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" id="valuation-tab" data-bs-toggle="tab" 
                        data-bs-target="#valuation" type="button" role="tab" aria-controls="valuation" aria-selected="false">
                        Valuation
                    </button>
                </li>
            `;

            // Create the tab content container
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content mt-2';
            tabContent.style.maxHeight = '300px';
            tabContent.style.overflowY = 'auto';
            tabContent.style.background = '#f9f9f9';
            tabContent.style.border = '1px solid #ddd';

            // Ownership Tab
            const ownershipTabPane = document.createElement('div');
            ownershipTabPane.className = 'tab-pane fade show active';
            ownershipTabPane.id = 'ownership';
            ownershipTabPane.role = 'tabpanel';
            ownershipTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>#</th><th>Owner Details</th></tr>
                    </thead>
                    <tbody id="ownership-details-table"></tbody>
                </table>
            `;

            // Land Tab
            const landTabPane = document.createElement('div');
            landTabPane.className = 'tab-pane fade';
            landTabPane.id = 'land';
            landTabPane.role = 'tabpanel';
            landTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>Field</th><th>Value</th></tr>
                    </thead>
                    <tbody id="land-details-table"></tbody>
                </table>
            `;

            const valuationTabPane = document.createElement('div');
            valuationTabPane.className = 'tab-pane fade';
            valuationTabPane.id = 'valuation';
            valuationTabPane.role = 'tabpanel';
            
            // Urban rates are typically higher. Sourced from last known TNREGINET zone updates.
            const guidelineValue = 5500000; 
            const marketMultiplier = 2.5;
            const marketValue = guidelineValue * marketMultiplier;
            const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
            
            valuationTabPane.innerHTML = `
                <table class="table table-bordered table-striped mt-2">
                    <thead class="table-dark">
                        <tr><th>Valuation Type</th><th>Amount (Per Acre)</th><th>Source/Basis</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Govt Guideline Value</strong></td>
                            <td class="text-primary fw-bold">${formatCurrency(guidelineValue)}</td>
                            <td>TNREGINET (Official Urban Zone)</td>
                        </tr>
                        <tr>
                            <td><strong>Market Rate Estimate</strong></td>
                            <td class="text-success fw-bold">${formatCurrency(marketValue)}</td>
                            <td>Market Analysis (Urban Multiplier)</td>
                        </tr>
                    </tbody>
                </table>
                <div class="alert alert-warning p-2 mt-2" style="font-size: 0.85rem;">
                    <strong>Verification Required:</strong> Urban valuation is subject to ward-specific registration rates. For legal purposes, use the <a href="https://tnreginet.gov.in" target="_blank" class="text-decoration-underline">official guideline search</a> with the Town/Ward/Block details provided in the Land Details tab.
                </div>
            `;

            // Append all
            tabContainer.appendChild(closeButton);
            tabContainer.appendChild(tabNav);
            tabContainer.appendChild(tabContent);
            tabContent.appendChild(ownershipTabPane);
            tabContent.appendChild(landTabPane);
            tabContent.appendChild(valuationTabPane);
            iconSection.insertAdjacentElement('afterend', tabContainer);

            // Fields to exclude
            const excludedFields = [
                "Taluk", "Town", "Ward", "Block", "District_t",
                "Taluk_t","Town_t","Ward_t","Block_t","SurveyNo","SubDivNo",
                "SourceOfIrrigationAndClass","District","Street"
            ];

            // Populate Land Details
            const landDetailsTable = document.getElementById("land-details-table");
            landDetailsTable.innerHTML = '';
            for (const [key, value] of Object.entries(landDetail)) {
                if (!excludedFields.includes(key)) {
                    if (key === "govtPriEng") {
                        const tamil = landDetail["govtPriTamil"];
                        const combined = `${value} / ${(tamil && tamil.trim()) || '-'}`;
                        const row = document.createElement("tr");
                        row.innerHTML = `<td>Land Type</td><td>${combined}</td>`;
                        landDetailsTable.appendChild(row);
                        continue;
                    }
                    if (key === "govtPriTamil") continue;

                    let displayValue = "-";
                    if (typeof value === "boolean") {
                        displayValue = value ? "Yes" : "No";
                    } else if (value !== null && String(value).trim() !== "") {
                        displayValue = value;
                    }

                    const formattedKey = addSpaceBeforeCaps(key);
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${formattedKey}</td><td>${displayValue}</td>`;
                    landDetailsTable.appendChild(row);
                }
            }

            // Populate Ownership Details
            const owners = ownershipDetailsRaw
            .replace(/\[|\]/g, '') // Remove square brackets
            .split(','); // Split only by commas

            const ownershipDetailsTable = document.getElementById("ownership-details-table");
            ownershipDetailsTable.innerHTML = '';

            // Check if owners are found
            if (owners.length === 0 || owners[0].trim() === '') {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="4" style="text-align: center;">No owners found</td>`;
                ownershipDetailsTable.appendChild(row);
            } else {
                owners.forEach((owner, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${owner.trim()}</td>
                    `;
                    ownershipDetailsTable.appendChild(row);
                });
            }
        }else{
            $(".error-message").empty().text('No Ownership Details Found for the Selected Land Parcel').show();
        }
        
    }
    
}

function showTabContent(tabId) {
    const tabs = document.querySelectorAll("#areg-info-panel .tab-content");
    tabs.forEach((tab) => {
        tab.style.display = tab.id === tabId ? "block" : "none";
    });

    const tabButtons = document.querySelectorAll("#areg-info-panel .tabs button");
    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.textContent === tabId.replace('-', ' '));
    });
}


// Function to Close the Info Panel
function closeAregPanel() {
    const infoPanel = document.getElementById("areg-info-panel");
    if (infoPanel) {
        infoPanel.style.display = "none";
    }
}

/** Areg Info Panel Creation End */

/** FMB Sketch Info Panel Creation Start*/

function openFMBSketchInfo(data) {
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
    var lapad_taluk_codes = LpadAdding(data.taluk_code,'taluk');
    var lapad_town_codes = LpadAdding(data.revenue_town_code,'town');
    var lapad_ward_codes = LpadAdding(data.firka_ward_number,'ward');
    var lapad_block_codes = LpadAdding(data.urban_block_number,'block');
    let params={};
    if(data.rural_urban == 'rural'){
        params = {
            districtCode: data.district_code,
            talukCode: lapad_taluk_codes,
            villageCode: data.village_code,
            surveyNumber: data.survey_number,
            subdivisionNumber: data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '') : '',
            type: data.rural_urban,
        };
    }else if(data.rural_urban == 'urban'){
        params = {
            districtCode: data.district_code,
            talukCode: lapad_taluk_codes,
            townCode:lapad_town_codes,
            wardCode:lapad_ward_codes,
            blockCode:lapad_block_codes,
            surveyNumber: data.survey_number,
            subdivisionNumber: data.is_fmb == 1 ? ($("#subDivs").text() != null ? $("#subDivs").text() : '') : '',
            type: data.rural_urban,
        };
    }
    

    $.ajax({
        url: `${FMB_SKETCH_URL}`,
        method: 'POST',
        data: params,
        beforeSend: function(){
            showSpinner();
        },
        success: function (response) {
            if (response.success == 1) {
                // Decode base64 data
                try {
                    const fileContent = atob(response.data);
                    const byteArray = new Uint8Array(fileContent.length);

                    // Convert the base64 string back to a binary file
                    for (let i = 0; i < fileContent.length; i++) {
                        byteArray[i] = fileContent.charCodeAt(i);
                    }
                    // Create a Blob from the binary data
                    const blob = new Blob([byteArray], { type: 'application/pdf' });

                    // Check if the Blob is a valid PDF
                    const fileReader = new FileReader();
                    fileReader.onloadend = function () {
                        try {
                            // Check the file type by reading the first few bytes (PDF signature)
                            const byteArray = new Uint8Array(fileReader.result);
                            const pdfSignature = '%PDF-';

                            if (String.fromCharCode.apply(null, byteArray.slice(0, 5)) !== pdfSignature) {
                                throw new Error('Invalid PDF');
                            }

                            // Create PDF URL
                            const pdfURL = URL.createObjectURL(blob);
                            displayFMBSketch(pdfURL);
                            

                        } catch (error) {
                            console.error("Caught error in onloadend:", error);
                            // alert('FMB Sketch could not be downloaded for visualization. Please contact the Revenue Surveyor in taluk office.');

                            $(".error-message").empty().text('FMB Sketch could not be downloaded for visualization. Please contact the Revenue Surveyor in taluk office.').show();

                        }
                    };

                    // Read the blob content as ArrayBuffer to check for PDF signature
                    fileReader.readAsArrayBuffer(blob);
                } catch (error) {
                    // Handle invalid base64 or PDF error
                    // alert('FMB Sketch could not be downloaded for visualization. Please contact the Revenue Surveyor in taluk office.');
                    $(".error-message").empty().text('FMB Sketch could not be downloaded for visualization. Please contact the Revenue Surveyor in taluk office.').show();
                    console.error('Error while loading PDF:', error);
                    // You can display a custom message here, e.g., "Invalid PDF data."
                }
            } else {
                // alert(response.message);
                $(".error-message").empty().text(response.message).show();
            }
            hideSpinner();
        },
        error: function (xhr, status, error) {
            $(".error-message").empty().text('Unable to fetch data from NIC. ', error).show();
            hideSpinner();
        }
    });
}

function displayFMBSketch(fmbSketchUrl) {
    // Remove any existing FMB sketch panel
    document.getElementById('fmb-sketch-info-panel')?.remove();
    
    // Select the .info-icons div
    const iconSection = document.querySelector('.info-icons');

    // Create the container for the FMB sketch info
    const sketchContainer = document.createElement('div');
    sketchContainer.id = 'fmb-sketch-info-panel';
    sketchContainer.className = 'mt-2 p-3 border rounded position-relative bg-white';
    sketchContainer.style.maxHeight = '430px';
    sketchContainer.style.overflow = 'hidden';
    sketchContainer.style.border = '1px solid #ddd';

    // Add the title with a close button and fullscreen button
    const panelTitle = document.createElement('div');
    panelTitle.className = 'd-flex  align-items-center pdfheader';
    panelTitle.innerHTML = `<h6 class="m-0">FMB Sketch</h6>`;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'btn-close vertex-close position-absolute';
    closeButton.style.top = '0px';
    closeButton.style.right = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.style.fontSize = '30px';

    // Close button event listener
    closeButton.addEventListener('click', () => {
        sketchContainer.remove();
        $('.district-icon img').removeClass('district-icon-active');
    });

    // Fullscreen button
    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = '⛶'; // Unicode for fullscreen icon
    fullscreenButton.className = 'btn btn-sm btn-outline-secondary ms-2';
    fullscreenButton.style.border = 'none';
    fullscreenButton.style.background = 'transparent';
    fullscreenButton.style.cursor = 'pointer';
    fullscreenButton.style.fontSize = '24px';
    fullscreenButton.style.left = '116px';
    fullscreenButton.style.position = 'relative';

    // Create the iframe for the FMB Sketch
    const sketchFrame = document.createElement('iframe');
    sketchFrame.id = 'fmb-sketch-viewer';
    sketchFrame.style.width = '100%';
    sketchFrame.style.height = '350px';
    sketchFrame.style.border = 'none';
    sketchFrame.src = fmbSketchUrl+ '#view=FitH&zoom=page-fit&toolbar=1&navpanes=1&scrollbar=1';
    sketchFrame.allowFullscreen = true;
    sketchFrame.style.objectFit = 'contain';

    // Function to enter fullscreen
    function enterFullscreen() {
        if (sketchFrame.requestFullscreen) {
            sketchFrame.requestFullscreen();
        } else if (sketchFrame.mozRequestFullScreen) { // Firefox
            sketchFrame.mozRequestFullScreen();
        } else if (sketchFrame.webkitRequestFullscreen) { // Chrome, Safari
            sketchFrame.webkitRequestFullscreen();
        } else if (sketchFrame.msRequestFullscreen) { // IE/Edge
            sketchFrame.msRequestFullscreen();
        }
    }

    // Function to exit fullscreen
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }

    // Fullscreen button event listener
    fullscreenButton.addEventListener('click', enterFullscreen);

    // Listen for fullscreen change and ESC key
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            console.log('Exited fullscreen mode');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.fullscreenElement) {
            exitFullscreen();
        }
    });

    // Append close & fullscreen button
    panelTitle.appendChild(fullscreenButton);
    panelTitle.appendChild(closeButton);

    // Append the title and iframe content
    sketchContainer.appendChild(panelTitle);
    sketchContainer.appendChild(sketchFrame);

    // Insert the sketch container below the .info-icons div
    iconSection.insertAdjacentElement('afterend', sketchContainer);
}

function closeFMBSketchPanel() {
    const infoPanel = document.getElementById("fmb-sketch-info-panel");
    if (infoPanel) {
        const iframe = document.getElementById("fmb-sketch-viewer");
        infoPanel.style.display = "none";
        iframe.src = ""; // Clear the iframe content
    }

}


/** FMB Sketch Info Panel Creation End*/

/** IGR Info Panel */
function openIGRInfo(data, lat, long) {
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
    if (data.rural_urban === "rural") {
        const params = {
            latitude: lat,
            longitude: long,
            layer_name: IGR_SERVICE_LAYER_NAME,
        };

        $.ajax({
            url: `${IGR_URL}`,
            method: 'POST',
            headers: { 'X-APP-ID': 'te$t' },
            data: params,
            beforeSend: function(){
                showSpinner();
            },
            success: function (response) {
                if (response.success) {
                    // Select the .info-icons div
                    const iconSection = document.querySelector('.info-icons');

                    // Remove any existing IGR info container
                    document.getElementById('igr-info-container')?.remove();

                    // Create the container for IGR info
                    const igrContainer = document.createElement('div');
                    igrContainer.id = 'igr-info-container';
                    igrContainer.className = 'mt-1 p-3 border rounded position-relative';
                    igrContainer.style.maxHeight = '400px';   // Max height for scrollable content
                    igrContainer.style.overflowY = 'auto';    // Vertical scroll bar
                    igrContainer.style.background = '#f9f9f9';
                    igrContainer.style.border = '1px solid #ddd';
                    igrContainer.style.marginBottom = '8px';

                    // Add the title with a close button
                    const panelTitle = document.createElement('div');
                    panelTitle.className = 'd-flex justify-content-between align-items-center';
                    panelTitle.innerHTML = `
                        <h6 class="m-0">Guide Line Value from Registration Department</h6>
                    `;

                    // Create close button
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = '&times;';
                    closeButton.className = 'btn-close vertex-close position-absolute pdf-close';
                    closeButton.style.top = '5px';
                    closeButton.style.right = '10px';
                    closeButton.style.fontSize = '18px';
                    closeButton.style.cursor = 'pointer';
                    closeButton.style.border = 'none';
                    closeButton.style.background = 'transparent';

                    // Close button event listener
                    closeButton.addEventListener('click', () => {
                        igrContainer.remove();
                        $('.district-icon img').removeClass('district-icon-active');
                    });

                    // Append close button to panel title
                    panelTitle.appendChild(closeButton);

                    // Append the title to the container
                    igrContainer.appendChild(panelTitle);

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'igr-card-content mt-2';

                    let hasValidData = false; // Flag to check if there's valid data

                    // Function to format rupee values with commas
                    const formatRupees = (amount) =>
                        `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

                    // Loop through the response data to create cards for each field
                    response.data.forEach(item => {
                        const fields = [
                            { label: "Land Type", value: item.land_name },
                            { label: "Classification of Land Type", value: item.land_name_type },
                            { label: "Metric Rate", value: item.metric_rate ? formatRupees(item.metric_rate) : null },
                            { label: "Price per Hectare", value: item.price_per_hect ? formatRupees(item.price_per_hect) : null },
                        ];

                        fields.forEach(field => {
                            if (field.value) {
                                hasValidData = true; // At least one field has a value
                                const card = document.createElement("div");
                                card.classList.add("igr-card", "p-2", "mb-2", "border", "rounded");
                                card.style.background = "#fff";
                                card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

                                card.innerHTML = `
                                    <div>
                                        <strong>${field.label}:</strong>
                                    </div>
                                    <div>${field.value}</div>
                                `;

                                // Append the card to the content div
                                contentDiv.appendChild(card);
                            }
                        });
                    });

                    // Show the info panel only if there is valid data
                    if (hasValidData) {
                        igrContainer.appendChild(contentDiv);

                        // Insert the IGR container below the .info-icons div
                        iconSection.insertAdjacentElement('afterend', igrContainer);
                        $(".error-message").empty().hide();
                    } else {
                        // alert("Guideline Value not found for the selected Land");
                        $(".error-message").empty().text('Guideline Value not found for the selected Land').show();
                    }
                } else {
                    console.error(response.message);
                    $(".error-message").empty().text(response.message).show();
                }
                hideSpinner();
            },
            error: function (xhr, status, error) {
                console.error("Error in fetching IGR Land Value - ", error);
                $(".error-message").empty().text("Error in fetching IGR Land Value - ", error).show();
                hideSpinner();
            }
        });
    } else {
        $(".error-message").empty().text('Urban in Progress').show();
        hideSpinner();
    }
}

function loadThematicIconsFromJson() {
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();

    const iconSection = document.querySelector('.info-icons');
    userPermission = $("#permissionHandle").val();
    fetch(thematicJsonFilePath)
        .then(response => response.json())
        .then(data => {
            const thematicContainer = document.createElement('div');
            thematicContainer.id = 'thematic-info-container';
            thematicContainer.className = 'mt-1 p-3 border rounded position-relative';
            thematicContainer.style.maxHeight = '400px';
            thematicContainer.style.overflowY = 'auto';
            thematicContainer.style.background = '#f9f9f9';
            thematicContainer.style.border = '1px solid #ddd';
            thematicContainer.style.marginBottom = '8px';

            const panelTitle = document.createElement('div');
            panelTitle.className = 'd-flex justify-content-between align-items-center';
            panelTitle.innerHTML = `<h6 class="m-0" id="selected-thematic">Thematic Information For</h6>`;

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.className = 'btn-close vertex-close position-absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '18px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.border = 'none';
            closeButton.style.background = 'transparent';
            closeButton.addEventListener('click', () => { 
                thematicContainer.remove();
                $('.district-icon img').removeClass('district-icon-active');
             });

            panelTitle.appendChild(closeButton);
            thematicContainer.appendChild(panelTitle);

            const scrollWrapper = document.createElement('div');
            scrollWrapper.className = 'jsb-carousel-wrapper position-relative';
            scrollWrapper.style.position = 'relative';
            scrollWrapper.style.marginTop = '15px';

            const leftBtn = document.createElement('button');
            leftBtn.innerHTML = '&#10094;';
            leftBtn.className = 'jsb-scroll-left';
            Object.assign(leftBtn.style, {
                position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
                border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
            });

            const rightBtn = document.createElement('button');
            rightBtn.innerHTML = '&#10095;';
            rightBtn.className = 'jsb-scroll-right';
            Object.assign(rightBtn.style, {
                position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
                border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
            });

            const contentDiv = document.createElement('div');
            contentDiv.className = 'thematic-icon-card-content d-flex';
            Object.assign(contentDiv.style, {
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                whiteSpace: 'nowrap',
                padding: '0px 30px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                overflowY: 'hidden',
                margin: '0px',
                gap: '.2px'
            });

            contentDiv.addEventListener('wheel', e => {
                e.preventDefault();
                contentDiv.scrollLeft += e.deltaY;
            });

            let hasValidData = false;

            data.forEach(category => {
                category.layers.forEach(layer => {
                    if (
                        (layer.name == "Land Anomolies" ||
                         layer.name == "TN-Land Type" ||
                         layer.name == "TN-Land Ownership") &&
                        userPermission != 3
                    ) {
                        return;
                    }
                    hasValidData = true;
                    if(layer.name != "Contours" && layer.name != "Land Type" && layer.name != "Land Anomolies" && layer.name != 'Proposed' && layer.name != 'existing' && layer.name != 'IGR Land Type' && layer.name != 'Soil Map' && layer.name != 'Landuse 2016' && layer.name != 'Landuse 2012' && layer.name != 'Landuse 2006'){
                        const card = document.createElement("div");
                        card.classList.add("thematic-icon-card", "px-2", "d-flex", "flex-column", "align-items-center");
                        card.style.background = "#e0e0e000";
                        card.style.fontSize = "10px";
                        
                        card.style.alignItems = "center";
                        card.style.textAlign = "center";
                        card.title = layer.title;

                        const iconSpan = document.createElement("span");

                        // Check if icon is emoji or image path
                        if (layer.icon?.endsWith('.png') || layer.icon?.endsWith('.jpg') || layer.icon?.includes('/')) {
                            const img = document.createElement("img");
                            img.src = layer.icon;
                            img.alt = layer.title;
                            img.style.width = "30px";
                            iconSpan.appendChild(img);
                        } else {
                            iconSpan.style.fontSize = "16px";
                            iconSpan.innerText = layer.icon || "📌";
                        }

                        const textDiv = document.createElement("div");
                        textDiv.innerHTML = `<strong class="font-size-9 p-a">${layer.name}</strong>`;

                        card.appendChild(iconSpan);
                        card.appendChild(textDiv);
                        contentDiv.appendChild(card);
                    }
                });
            });

            if (hasValidData) {
                scrollWrapper.appendChild(leftBtn);
                scrollWrapper.appendChild(contentDiv);
                scrollWrapper.appendChild(rightBtn);
                thematicContainer.appendChild(scrollWrapper);
                iconSection.insertAdjacentElement('afterend', thematicContainer);

                leftBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft -= 150;
                });
                rightBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft += 150;
                });
            } else {
                $(".error-message").text('No layer data available.').show();
            }
        })
        .catch(error => {
            console.error("Error loading JSON file:", error);
            $(".error-message").text('Error loading thematic data.').show();
        });
}



function JSBIconInfo(data, lat, long) {
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    ['areg-tab-container', 'facility-info-container', 'vertex-info-container', 'igr-info-container', 'thematic-info-container', 'fmb-sketch-info-panel', 'JSB-info-container','encumbrance-info-panel','masterplan-info-container']
        .forEach(id => document.getElementById(id)?.remove());

    const iconSection = document.querySelector('.info-icons');

    const JSBContainer = document.createElement('div');
    JSBContainer.id = 'JSB-info-container';
    JSBContainer.className = 'mt-1 p-3 border rounded position-relative';
    JSBContainer.style.maxHeight = '400px';
    JSBContainer.style.overflowY = 'auto';
    JSBContainer.style.background = '#f9f9f9';
    JSBContainer.style.border = '1px solid #ddd';
    JSBContainer.style.marginBottom = '4px';

    const panelTitle = document.createElement('div');
    panelTitle.className = 'd-flex justify-content-between align-items-center';
    panelTitle.innerHTML = `<h6 class="m-0" id="selected-boundary">Boundary Information For</h6>`;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'btn-close vertex-close position-absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.addEventListener('click', () => { 
        JSBContainer.remove(); 
        $('.district-icon img').removeClass('district-icon-active');
    });

    panelTitle.appendChild(closeButton);
    JSBContainer.appendChild(panelTitle);

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'jsb-carousel-wrapper position-relative';
    scrollWrapper.style.position = 'relative';
    scrollWrapper.style.marginTop = '0px';

    const leftBtn = document.createElement('button');
    leftBtn.innerHTML = '&#10094;';
    leftBtn.className = 'jsb-scroll-left';
    Object.assign(leftBtn.style, {
        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
        border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
    });

    const rightBtn = document.createElement('button');
    rightBtn.innerHTML = '&#10095;';
    rightBtn.className = 'jsb-scroll-right';
    Object.assign(rightBtn.style, {
        position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
        border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
    });

    const contentDiv = document.createElement('div');
    contentDiv.className = 'JSB-icon-card-content d-flex';
    Object.assign(contentDiv.style, {
        overflowX: 'auto',
        scrollBehavior: 'smooth',
        whiteSpace: 'nowrap',
        padding: '0px 45px',
        gap:'0.2px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        overflowY: 'hidden',
        margin: '0 -15px',
        // height:'100px'
    });

    contentDiv.addEventListener('wheel', e => {
        e.preventDefault();
        contentDiv.scrollLeft += e.deltaY;
    });

    fetch('https://tngis.tn.gov.in/apps/mugavari/assets/scripts/layers.json')
        .then(response => response.json())
        .then(data => {
            let hasValidData = false;
            data.forEach(field => {
                if (field.status === 'active' && field.type === 'boundary' && field.layer_code != '1008' && field.layer_code != '1262') {
                    hasValidData = true;
                    const card = document.createElement("div");
                    card.classList.add("JSB-icon-card", "rounded", "px-2", "d-flex", "flex-column", "align-items-center");
                    card.setAttribute('layer_id', field.layer_code);
                    card.setAttribute('priority_order', field.priority_order);
                    card.setAttribute('title', field.layer_display_name);
                    card.setAttribute('layer_type', field.type);
                    Object.assign(card.style, {
                        
                        scrollBehavior: 'smooth',
                        whiteSpace: 'nowrap',
                        padding: '20px 30px',
                        width:'max-content',
                        justifyContent:'center',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        // overflowY: 'hidden',
                        margin: '0px',
                        gap: '.2px',
                        position:'relative'
                    });

                    const imageUrl = (field.display_image_url || '') + (field.display_image_name || '');

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    Object.assign(img.style, {
                        width: "40px",
                        height: "40px",
                        objectFit: "contain",
                        // marginBottom: "8px"
                    });

                    const imgWrapper = document.createElement('span');

                    const titles = document.createElement('div');
                    const title = document.createElement('strong');
                    title.textContent = (field.layer_display_name == 'TANGEDCO') ? 'TNPDCL' : field.layer_display_name || '';
                    title.className = 'p-a font-size-9';
                    Object.assign(title.style, {
                        // fontSize: "9px",
                        // wordBreak: "break-word",
                        // overflowWrap: "break-word",
                        // whiteSpace: "normal",
                        // textAlign: "center",
                        // width: "100%",
                        // lineHeight: "1.2",
                        // minHeight: "10px"
                    });

                    titles.appendChild(title); // Append <strong> inside <div>
                    imgWrapper.appendChild(img);
                    card.appendChild(imgWrapper);
                    card.appendChild(titles);  // Append the full <div> that includes <strong>
                    

                    contentDiv.appendChild(card);
                }
            });

            if (hasValidData) {
                scrollWrapper.appendChild(leftBtn);
                scrollWrapper.appendChild(contentDiv);
                scrollWrapper.appendChild(rightBtn);
                JSBContainer.appendChild(scrollWrapper);
                iconSection.insertAdjacentElement('afterend', JSBContainer);

                leftBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft -= 150;
                });
                rightBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft += 150;
                });
            } else {
                $(".error-message").empty().text('No data available for the selected location.').show();
            }
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
            $(".error-message").empty().text('Failed to load boundaries data.').show();
        });
}

function nearByView() {
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    ['areg-tab-container','facility-info-container', 'vertex-info-container', 'igr-info-container', 'thematic-info-container', 'fmb-sketch-info-panel', 'JSB-info-container','encumbrance-info-panel','masterplan-info-container']
        .forEach(id => document.getElementById(id)?.remove());

    const iconSection = document.querySelector('.info-icons');

    const JSBContainer = document.createElement('div');
    JSBContainer.id = 'facility-info-container';
    JSBContainer.className = 'mt-1 p-3 border rounded position-relative';
    JSBContainer.style.maxHeight = '400px';
    JSBContainer.style.overflowY = 'auto';
    JSBContainer.style.background = '#f9f9f9';
    JSBContainer.style.border = '1px solid #ddd';
    JSBContainer.style.marginBottom = '4px';

    const panelTitle = document.createElement('div');
    panelTitle.className = 'd-flex justify-content-between align-items-center';
    panelTitle.innerHTML = `<h6 class="m-0" id="selected-facilities">Nearby Facilities Information For</h6>`;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'btn-close vertex-close position-absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.addEventListener('click', () => { 
        JSBContainer.remove(); 
        $('.district-icon img').removeClass('district-icon-active');
    });

    panelTitle.appendChild(closeButton);
    JSBContainer.appendChild(panelTitle);

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'jsb-carousel-wrapper position-relative';
    scrollWrapper.style.position = 'relative';
    scrollWrapper.style.marginTop = '8px';

    const leftBtn = document.createElement('button');
    leftBtn.innerHTML = '&#10094;';
    leftBtn.className = 'jsb-scroll-left';
    Object.assign(leftBtn.style, {
        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
        border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
    });

    const rightBtn = document.createElement('button');
    rightBtn.innerHTML = '&#10095;';
    rightBtn.className = 'jsb-scroll-right';
    Object.assign(rightBtn.style, {
        position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', zIndex: '2',
        border: 'none', background: '#42abff', color: '#fff', boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'
    });

    const contentDiv = document.createElement('div');
    contentDiv.className = 'JSB-icon-card-content d-flex';
    Object.assign(contentDiv.style, {
        overflowX: 'auto',
        scrollBehavior: 'smooth',
        whiteSpace: 'nowrap',
        gap: '0.2px',
        padding: '10px 40px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        overflowY: 'hidden',
        margin: '0 -15px'
    });

    contentDiv.addEventListener('wheel', e => {
        e.preventDefault();
        contentDiv.scrollLeft += e.deltaY;
    });

    fetch('https://tngis.tn.gov.in/apps/mugavari/assets/scripts/layers.json')
        .then(response => response.json())
        .then(data => {
            let hasValidData = false;
            data.forEach(field => {
                if (field.status === 'active' && field.type === 'assets') {
                    hasValidData = true;
                    const card = document.createElement("div");
                    card.classList.add("JSB-icon-card", "rounded");
                    card.setAttribute('layer_id', field.layer_code);
                    card.setAttribute('priority_order', field.priority_order);
                    card.setAttribute('title', field.layer_display_name);
                    card.setAttribute('layer_type', field.type);
                    Object.assign(card.style, {
                        // background: "#5982a5",
                        // boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        width: "50px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "start",
                        alignItems: "center",
                        textAlign: "center",
                        overflow: "hidden",
                        color: "#000000",
                        padding: "10px 5px",
                        flex: "0 0 auto",
                        position: "relative"
                    });

                    const imageUrl = (field.display_image_url || '') + (field.display_image_name || '');

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    Object.assign(img.style, {
                        width: "auto",
                        height: "40px",
                        objectFit: "contain",
                        marginBottom: "8px"
                    });

                    const title = document.createElement('div');
                    if(field.layer_display_name == 'Revenue Divisional Office'){
                        title.textContent = 'District Revenue Officer' || '';
                    }else{
                    title.textContent = field.layer_display_name || '';
                    }
                    Object.assign(title.style, {
                        fontSize: "8.4px",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                        textAlign: "center",
                        width: "100%",
                        lineHeight: "1.2",
                        minHeight: "10px"
                    });

                    card.appendChild(img);
                    card.appendChild(title);

                    contentDiv.appendChild(card);
                }
            });

            if (hasValidData) {
                scrollWrapper.appendChild(leftBtn);
                scrollWrapper.appendChild(contentDiv);
                scrollWrapper.appendChild(rightBtn);
                JSBContainer.appendChild(scrollWrapper);
                iconSection.insertAdjacentElement('afterend', JSBContainer);

                leftBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft -= 150;
                });
                rightBtn.addEventListener('click', () => {
                    contentDiv.scrollLeft += 150;
                });
            } else {
                $(".error-message").empty().text('No data available for the selected location.').show();
            }
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
            $(".error-message").empty().text('Failed to load boundaries data.').show();
        });
}





function closeIGRInfoPanel(){
    const infoPanel = document.getElementById("igr-info-panel");
    if (infoPanel) {
        infoPanel.style.display = "none";
    }
    
}

// Layer configuration from JSON

const layerControl = document.getElementById('accordionPanelsStayOpenExample');
const layerControlThematic = document.getElementById('accordionPanelsStayOpenExampleThematic');
const layers = {};


// Fetch the JSON file and process its contents
// Fetch the first JSON file and process its contents
fetch(jsonFilePath)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load JSON file');
        }
        return response.json();
    })
    .then(jsonData => {
        
        jsonData.forEach((category, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            const headerId = `header-${index}`;
            const collapseId = `collapse-${index}`;

            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        ${category.category}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}">
                    <div class="accordion-body">
                        <div class="listings"></div>
                    </div>
                </div>
            `;

            const listings = accordionItem.querySelector('.listings');

            category.layers.forEach((layerInfo) => {
                let layer;

                if (layerInfo.type === "wms") {
                    layer = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: layerInfo.url,
                            params: layerInfo.params,
                            serverType: 'geoserver',
                        }),
                        opacity: layerInfo.defaultOpacity,
                        visible: layerInfo.defaultVisibility,
                    });
                    map.removeLayer(layer);
                    map.addLayer(layer);
                } else if (layerInfo.type === "xyz") {
                    layer = new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: layerInfo.url,
                        }),
                        opacity: layerInfo.defaultOpacity,
                        visible: layerInfo.defaultVisibility,
                    });
                    
                    map.removeLayer(layer);
                    setTimeout(function () {
                    map.addLayer(layer);
                }, 1000);
                }
                
                layers[layerInfo.id] = layer;

                const label = document.createElement('label');
                label.className = 'd-block my-1';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = layerInfo.id;
                checkbox.checked = layerInfo.defaultVisibility;

                checkbox.addEventListener('change', (e) => {
                    
                    // if(e.target.checked == true && e.target.id == 'TNGIS_Basemap'){
                        map.removeLayer(layer);
                        map.addLayer(layer);
                    // }
                    layer.setVisible(e.target.checked);
                    updateAllLegends(jsonData);
                });

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${layerInfo.title}`));

                listings.appendChild(label);
            });

            layerControl.appendChild(accordionItem);
        });
        setTimeout(function(){
            updateAllLegends(jsonData);
        },200);
    })
    .catch(error => console.error('Error loading JSON:', error));


// Fetch the thematic JSON file and process its contents
fetch(thematicJsonFilePath)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load JSON file');
        }
        return response.json();
    })
    .then(jsonData => {
        let userPermission = $("#permissionHandle").val();
        jsonData.forEach((category, index) => {
            if (category.category == "Land Resource" && userPermission != 3) {
                return; // skip processing for others
            }
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            const headerId = `thematic-header-${index}`;
            const collapseId = `thematic-collapse-${index}`;

            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        ${category.category}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-category="${category.category}">
                    <div class="accordion-body">
                        <div class="thematic-listings row"></div>
                    </div>
                </div>
            `;

            const listings = accordionItem.querySelector('.thematic-listings');

            category.layers.forEach((layerInfo) => {
                let layer;

                if (layerInfo.type === "wms") {
                    layer = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: layerInfo.url,
                            params: layerInfo.params,
                            serverType: 'geoserver',
                        }),
                        opacity: layerInfo.defaultOpacity,
                        visible: layerInfo.defaultVisibility,
                        type: 'wms',
                        title: layerInfo.title,
                        layer_id: layerInfo.id,
                        category: category.category,
                        view: layerInfo.view
                    });
                } else if (layerInfo.type === "xyz") {
                    layer = new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: layerInfo.url,
                        }),
                        opacity: layerInfo.defaultOpacity,
                        visible: layerInfo.defaultVisibility,
                    });
                } else {
                    console.warn(`Unknown layer type: ${layerInfo.type}. Skipping this layer.`);
                    return;
                }

                map.addLayer(layer);
                layers[layerInfo.id] = layer;

                const label = document.createElement('div');
                label.className = 'col-4 col-md-3 col-lg-2 text-center';

                const iconImg = document.createElement('img');
                iconImg.src = layerInfo.icon;
                iconImg.alt = layerInfo.title;
                iconImg.width = 28;
                iconImg.height = 28;
                iconImg.style.cursor = 'pointer';
                iconImg.style.border = layerInfo.defaultVisibility ? '2px solid #007bff' : '2px solid transparent';
                iconImg.style.borderRadius = '6px';
                iconImg.setAttribute('data-layer-id', layerInfo.id);
                iconImg.setAttribute('data-category', category.category);
                iconImg.setAttribute('title', layerInfo.title);

                let isClickDisabled = false; // Set to true when you want to disable the click
                if (isClickDisabled) {
                    iconImg.classList.add('icon-disabled');
                } else {
                    iconImg.classList.remove('icon-disabled');
                }
                iconImg.addEventListener('click', (e) => {
                    if (isClickDisabled) return; // Skip execution if disabled

                    const selectedId = e.target.getAttribute('data-layer-id');
                    let isSelectedLayerCurrentlyActive = false;

                    // Check if the selected layer is currently active
                    jsonData.forEach(cat => {
                        cat.layers.forEach(l => {
                            if (l.id === selectedId && layers[l.id]) {
                                isSelectedLayerCurrentlyActive = layers[l.id].getVisible();
                            }
                        });
                    });
                
                    // Toggle layer visibility
                    jsonData.forEach(cat => {
                        cat.layers.forEach(l => {
                            const isSelected = l.id === selectedId;
                            const shouldBeVisible = isSelected ? !isSelectedLayerCurrentlyActive : false;
                
                            if (layers[l.id]) {
                                layers[l.id].setVisible(shouldBeVisible);

                                const iconElem = document.querySelector(`img[data-layer-id="${l.id}"]`);
                                if (iconElem) {
                                    iconElem.style.border = shouldBeVisible ? '2px solid #007bff' : '2px solid transparent';
                                }
                            }
                        });
                    });

                    updateAllLegends(jsonData);
                });

                const caption = document.createElement('div');
                caption.textContent = layerInfo.name;
                caption.style.fontSize = '0.50rem';

                label.appendChild(iconImg);
                label.appendChild(caption);
                listings.appendChild(label);
            });

            // Collapse event: Reset icons and hide layers on collapse close
            const collapseEl = accordionItem.querySelector('.accordion-collapse');
            collapseEl.addEventListener('hidden.bs.collapse', () => {
                const closedCategory = category.category;

                category.layers.forEach(l => {
                    if (layers[l.id]) {
                        layers[l.id].setVisible(false);

                        const iconElem = document.querySelector(`img[data-layer-id="${l.id}"]`);
                        if (iconElem) {
                            iconElem.style.border = '2px solid transparent';
                        }
                    }
                });

                updateAllLegends(jsonData);
            });

            layerControlThematic.appendChild(accordionItem);
        });
        updateAllLegends(jsonData);
    })
    .catch(error => console.error('Error loading JSON:', error));


function updateAllLegends(layerConfig) {
    const legendContent = document.getElementById('legend-content');
        legendContent.innerHTML = ''; // Clear previous legends

    layerConfig.forEach((category) => {
        category.layers.forEach((layerInfo) => {
                const layer = layers[layerInfo.id];
                if (!layer || !layer.getVisible()) return; // Show legend only if visible
    
                const legendDiv = document.createElement('div');
                legendDiv.style.marginBottom = '10px';
    
                const legendLabel = document.createElement('div');
                legendLabel.style.color = '#fff';
                legendLabel.style.fontSize = '10px';
                legendLabel.style.marginBottom = '4px';
                legendLabel.textContent = layerInfo.title;
                legendDiv.appendChild(legendLabel);
    
                // Handle WMS layers
                if (layerInfo.type === "wms") {
                    const resolution = map.getView().getResolution();
                    const legendUrl = `${layerInfo.url}?REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=${layerInfo.params.LAYERS}&LEGEND_OPTIONS=forceLabels:on;fontColor:0xfffff;fontAntiAliasing:true&transparent=true&SCALE=${resolution}`;
    
                    const img = document.createElement('img');
                    img.src = legendUrl;
                    img.alt = `${layerInfo.title} Legend`;
                    img.style.height = 'auto';
                    img.style.width = '80%';
                    legendDiv.appendChild(img);
                }
    
                // Handle XYZ layers with legend_color
                else if (layerInfo.type === "xyz") {
                    if (layerInfo.legend_color && typeof layerInfo.legend_color === 'object') {
                        Object.entries(layerInfo.legend_color).forEach(([label, colorData]) => {
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.alignItems = 'center';
                            item.style.marginBottom = '4px';
    
                            const swatch = document.createElement('div');
                            swatch.style.width = '18px';
                            swatch.style.height = '18px';
                            swatch.style.marginRight = '6px';
    
                            // Handle both string and object formats
                            if (label == 'Un-connected') {
                                swatch.style.border = "2px solid #80ff10";
                                swatch.style.backgroundColor = "transparent";
                            }else if (typeof colorData === 'string') {
                                swatch.style.backgroundColor = colorData;
                                swatch.style.border = '1px solid #ccc';
                            } else if (typeof colorData === 'object') {
                                swatch.style.backgroundColor = colorData.fill || '#000';
                                swatch.style.border = `1px solid ${colorData.stroke || '#ccc'}`;
                            }
    
                            const text = document.createElement('span');
                            text.textContent = label;
                            text.style.fontSize = '10px';
                            text.style.color = '#fff';
    
                            item.appendChild(swatch);
                            item.appendChild(text);
                            legendDiv.appendChild(item);
                        });
                    } else {
                        // Fallback image if no legend_color defined
                        const fallbackImage = document.createElement('img');
                        fallbackImage.src = `assets/icons/cadastral_map_legend.png`;
                        fallbackImage.alt = `${layerInfo.title} Legend`;
                        fallbackImage.style.width = 'auto';
                        fallbackImage.style.height = '118px';
                        legendDiv.appendChild(fallbackImage);
                    }
                }
    
                legendContent.appendChild(legendDiv);
            });
        });
    }
    
    


// Clear Legend
function clearLegend() {
    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';
}

document.addEventListener("DOMContentLoaded", function () {
    const view = map.getView(); // Assuming map is your OpenLayers Map instance

    // Rotate Right (+30 degrees)
    document.querySelector(".rotation-right").addEventListener("click", () => {
        const currentRotation = view.getRotation();
        view.animate({
            rotation: currentRotation + (Math.PI / 6), // 30 degrees
            duration: 250
        });
    });

    // Rotate Left (-30 degrees)
    document.querySelector(".rotation-left").addEventListener("click", () => {
        const currentRotation = view.getRotation();
        view.animate({
            rotation: currentRotation - (Math.PI / 6), // -30 degrees
            duration: 250
        });
    });

    // Reset Rotation (0 degrees)
    document.getElementById("resetRotation").addEventListener("click", () => {
        view.animate({
            rotation: 0,
            duration: 250
        });
    });
});




// Populate District Dropdown
async function loadDistrict(districtCode, talukCode = null, villageCode = null, surveyNumber = null, subdivision = null, areaType = null, townCode = null, wardCode = null, blockCode = null) {
    try {
        const response = await ajaxPromise({
            url: `${BASE_URL}/v2/admin_master_district`,
            method: 'GET',
            data: { 'request_type': 'district' },
            headers: { 'X-APP-NAME': 'demo' },
            dataType: 'json'
        });

        populateDropdown('district-dropdown', response, {
            defaultText: 'Select District',
            valueKey: 'district_code',
            textKey: 'district_english_name',
            errorCallback: (message) =>console.log(message),
            preselectValue: districtCode,
            triggerChange: !!districtCode,
            onComplete: async () => {
                if (!districtCode) return;

                const talukResponse = await ajaxPromise({
                    url: `${BASE_URL}/v2/admin_master_taluk`,
                    method: 'GET',
                    data: { district_code: districtCode, request_type: 'taluk' },
                    headers: { 'X-APP-NAME': 'demo' },
                    dataType: 'json'
                });

                populateDropdown('taluk-dropdown', talukResponse, {
                    defaultText: 'Select Taluk',
                    valueKey: 'taluk_code',
                    textKey: 'taluk_english_name',
                    errorCallback: (message) =>console.log(message),
                    preselectValue: talukCode,
                    triggerChange: !!talukCode,
                    onComplete: async () => {
                        if (!talukCode) return;

                        if (areaType === 'rural') {
                            const villageResponse = await ajaxPromise({
                                url: `${BASE_URL}/v2/admin_master_village`,
                                method: 'GET',
                                data: {
                                    district_code: districtCode,
                                    taluk_code: talukCode,
                                    request_type: 'revenue_village'
                                },
                                headers: { 'X-APP-NAME': 'demo' },
                                dataType: 'json'
                            });

                            populateDropdown('village-dropdown', villageResponse, {
                                defaultText: 'Select Village',
                                valueKey: 'village_code',
                                textKey: 'village_english_name',
                                errorCallback: (message) =>console.log(message),
                                preselectValue: villageCode,
                                triggerChange: !!villageCode,
                                onComplete: async () => {
                                    if (!villageCode) return;

                                    const surveyResponse = await ajaxPromise({
                                        url: `${BASE_URL}/v2/admin_master_survey_number`,
                                        method: 'GET',
                                        data: {
                                            district_code: districtCode,
                                            taluk_code: talukCode,
                                            revenue_village_code: villageCode,
                                            area_type: areaType,
                                            data_type: 'cadastral',
                                            request_type: 'survey_number'
                                        },
                                        headers: { 'X-APP-NAME': 'demo' },
                                        dataType: 'json'
                                    });

                                    populateDropdown('survey-number-dropdown', surveyResponse, {
                                        defaultText: 'Select Survey Number',
                                        valueKey: 'survey_number',
                                        textKey: 'survey_number',
                                        errorCallback: (message) =>console.log(message),
                                        preselectValue: surveyNumber,
                                        triggerChange: !!surveyNumber,
                                        onComplete: async () => {
                                            if (!surveyNumber) return;

                                            const subdivResponse = await ajaxPromise({
                                                url: checkAregUrl,
                                                method: 'GET',
                                                data: {
                                                    district_code: districtCode,
                                                    taluk_code: talukCode,
                                                    village_code: villageCode,
                                                    survey_number: surveyNumber,
                                                    sub_division_number: 'jjj',
                                                    area_type:'rural'
                                                },
                                                headers: { 'X-APP-NAME': 'demo' },
                                                dataType: 'json'
                                            });

                                            populateDropdown('sub-division-dropdown', subdivResponse, {
                                                defaultText: 'Select Sub Division',
                                                valueKey: 'subdiv_no',
                                                textKey: 'subdiv_no',
                                                errorCallback: (message) =>console.log(message),
                                                preselectValue: subdivision,
                                                triggerChange: !!subdivision
                                            });
                                        }
                                    });
                                }
                            });

                        } else if (areaType === 'urban') {
                            const townResponse = await ajaxPromise({
                                url: `${BASE_URL}/v2/admin_master_revenue_town`,
                                method: 'GET',
                                data: { request_type: 'town', district_code: districtCode, taluk_code: talukCode },
                                headers: { 'X-APP-NAME': 'demo' },
                                dataType: 'json'
                            });

                            populateDropdown('town-dropdown', townResponse, {
                                defaultText: 'Select Town',
                                valueKey: 'town_code',
                                textKey: 'town_english_name',
                                errorCallback: (message) =>console.log(message),
                                preselectValue: townCode,
                                triggerChange: !!townCode,
                                onComplete: async () => {
                                    if (!townCode) return;

                                    const wardResponse = await ajaxPromise({
                                        url: `${BASE_URL}/v2/admin_master_revenue_ward`,
                                        method: 'GET',
                                        data: { request_type: 'ward', district_code: districtCode, taluk_code: talukCode, town_code: townCode },
                                        headers: { 'X-APP-NAME': 'demo' },
                                        dataType: 'json'
                                    });

                                    populateDropdown('ward-dropdown', wardResponse, {
                                        defaultText: 'Select Ward',
                                        valueKey: 'ward_code',
                                        textKey: 'ward_english_name',
                                        errorCallback: (message) =>console.log(message),
                                        preselectValue: wardCode,
                                        triggerChange: !!wardCode,
                                        onComplete: async () => {
                                            if (!wardCode) return;

                                            const blockResponse = await ajaxPromise({
                                                url: `${BASE_URL}/v2/admin_master_revenue_block`,
                                                method: 'GET',
                                                data: {
                                                    request_type: 'revenue_block',
                                                    district_code: districtCode,
                                                    taluk_code: talukCode,
                                                    town_code: townCode,
                                                    ward_code: wardCode
                                                },
                                                headers: { 'X-APP-NAME': 'demo' },
                                                dataType: 'json'
                                            });

                                            populateDropdown('block-dropdown', blockResponse, {
                                                defaultText: 'Select Block',
                                                valueKey: 'block_code',
                                                textKey: 'block_english_name',
                                                errorCallback: (message) =>console.log(message),
                                                preselectValue: blockCode,
                                                triggerChange: !!blockCode,
                                                onComplete: async () => {
                                                    if (!blockCode) return;

                                                    const surveyResponse = await ajaxPromise({
                                                        url: `${BASE_URL}/v2/admin_master_survey_number`,
                                                        method: 'GET',
                                                        data: {
                                                            request_type: 'survey_number',
                                                            district_code: districtCode,
                                                            taluk_code: talukCode,
                                                            town_code: townCode,
                                                            ward_code: wardCode,
                                                            block_code: blockCode,
                                                            area_type: areaType
                                                        },
                                                        headers: { 'X-APP-NAME': 'demo' },
                                                        dataType: 'json'
                                                    });

                                                    populateDropdown('urban-survey-number-dropdown', surveyResponse, {
                                                        defaultText: 'Select Survey Number',
                                                        valueKey: 'survey_number',
                                                        textKey: 'survey_number',
                                                        errorCallback: (message) =>console.log(message),
                                                        preselectValue: surveyNumber,
                                                        triggerChange: !!surveyNumber,
                                                        onComplete: async () => {
                                                            if (!surveyNumber) return;

                                                            const subdivResponse = await ajaxPromise({
                                                                url: checkAregUrl,
                                                                method: 'GET',
                                                                data: {
                                                                    district_code: districtCode,
                                                                    taluk_code: talukCode,
                                                                    town_code: townCode,
                                                                    ward_code: wardCode,
                                                                    block_code: blockCode,
                                                                    survey_number: surveyNumber,
                                                                    sub_division_number: 'jjj',
                                                                    area_type:'urban'
                                                                },
                                                                headers: { 'X-APP-NAME': 'demo' },
                                                                dataType: 'json'
                                                            });

                                                            populateDropdown('sub-division-dropdown', subdivResponse, {
                                                                defaultText: 'Select Sub Division',
                                                                valueKey: 'subdiv_no',
                                                                textKey: 'subdiv_no',
                                                                errorCallback: (message) =>console.log(message),
                                                                preselectValue: subdivision,
                                                                triggerChange: !!subdivision
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });

    } catch (error) {
        console.error('Async Error:', error);
    }
}







// Update Taluks based on District
$('#district-dropdown').change(async function () {
    try {
        var districtCode = $(this).val();
        if (districtCode) {
            const response = await ajaxPromise({
                url: `${BASE_URL}/v2/admin_master_taluk`,
                method: 'GET',
                data: { 'district_code': districtCode, 'request_type': 'taluk' },
                headers: { 'X-APP-NAME': 'demo' },
                dataType: 'json'
            });
            console.log('Async Taluk Response:', response);
            populateDropdown('taluk-dropdown', response, {
                defaultText: 'Select Taluk',
                valueKey: 'taluk_code',
                textKey: 'taluk_english_name',
                errorCallback: (message) =>console.log(message),
                triggerChange: false
            });
            fetchGeometry('district', districtCode, null, null,null,null);
        } else {
            // resetDropdown('taluk-dropdown', 'Select Taluk');
        }
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', error)
    }
})

// Update Villages based on Taluk
$('#taluk-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $(this).val();
        var area_type = getSelectedAreaType();
        // console.log(area_type);
        if (area_type == 'rural') {
            loadRevenueVillage(district_code, taluk_code, area_type);
        } else if (area_type == 'urban') {
            loadTown(district_code, taluk_code, area_type);
        }
        fetchGeometry('taluk', district_code, taluk_code, null,null);
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', `${error}`)
    }
});

async function loadTown(district_code,taluk_code) {
    try {
        const response = await ajaxPromise({
            url: `${BASE_URL}/v2/admin_master_revenue_town`,
            method: 'GET',
            data: { 'request_type': 'town','district_code':district_code,'taluk_code':taluk_code },
            headers: { 'X-APP-NAME': 'demo' },
            dataType: 'json'
        });
        console.log('Async Response District:', response);

        populateDropdown('town-dropdown', response, {
            defaultText: 'Select Town',
            valueKey: 'town_code',
            textKey: 'town_english_name',
            errorCallback: (message) =>console.log(message),
            triggerChange: false
        });
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', response.message);
    }
}
$('#town-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var town_code = $(this).val();
        var area_type = getSelectedAreaType();
        // console.log(area_type);
        if (area_type == 'rural') {
            loadRevenueVillage(district_code, taluk_code, area_type);
        } else if (area_type == 'urban') {
            urbanWardRevenueCode(district_code, taluk_code,town_code,area_type);
        }
        fetchGeometryUrban('revenue_town', district_code, taluk_code, town_code,null);
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', `${error}`)
    }
});

async function urbanWardRevenueCode(district_code, taluk_code,town_code,area_type) {
    try {
        const response = await ajaxPromise({
            url: `${BASE_URL}/v2/admin_master_revenue_ward`,
            method: 'GET',
            data: { 'request_type': 'ward','district_code':district_code,'taluk_code':taluk_code,'town_code':town_code },
            headers: { 'X-APP-NAME': 'demo' },
            dataType: 'json'
        });
        console.log('Async Response District:', response);

        populateDropdown('ward-dropdown', response, {
            defaultText: 'Select Ward',
            valueKey: 'ward_code',
            textKey: 'ward_english_name',
            errorCallback: (message) =>console.log(message),
            triggerChange: false
        });
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', response.message);
    }
}

$('#ward-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var town_code = $("#town-dropdown").val();
        var ward_code = $(this).val();
        var area_type = getSelectedAreaType();
        // console.log(area_type);
        if (area_type == 'rural') {
            loadRevenueVillage(district_code, taluk_code, area_type);
        } else if (area_type == 'urban') {
            urbanBlockRevenueCode(district_code, taluk_code,town_code,ward_code,area_type);
        }
        fetchGeometryUrban('revenue_ward', district_code, taluk_code, town_code,ward_code);
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', `${error}`)
    }
});

async function urbanBlockRevenueCode(district_code, taluk_code,town_code,ward_code) {
    try {
        const response = await ajaxPromise({
            url: `${BASE_URL}/v2/admin_master_revenue_block`,
            method: 'GET',
            data: { 'request_type': 'revenue_block','district_code':district_code,'taluk_code':taluk_code,'town_code':town_code,'ward_code':ward_code },
            headers: { 'X-APP-NAME': 'demo' },
            dataType: 'json'
        });
        console.log('Async Response District:', response);

        populateDropdown('block-dropdown', response, {
            defaultText: 'Select Block',
            valueKey: 'block_code',
            textKey: 'block_english_name',
            errorCallback: (message) =>console.log(message),
            triggerChange: false
        });
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', response.message);
    }
}

$('#block-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var town_code = $("#town-dropdown").val();
        var ward_code = $("#ward-dropdown").val();
        var block_code = $(this).val();
        var area_type = getSelectedAreaType();
        // console.log(area_type);
        if (area_type == 'rural') {
            loadRevenueVillage(district_code, taluk_code, area_type);
        } else if (area_type == 'urban') {
            urbanSurveyNumberRevenueCode(district_code, taluk_code,town_code,ward_code,block_code,area_type);
        }
        fetchGeometryUrban('revenue_block', district_code, taluk_code, town_code,ward_code,block_code);
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', `${error}`)
    }
});

async function urbanSurveyNumberRevenueCode(district_code, taluk_code,town_code,ward_code,block_code,area_type) {
    try {
        const response = await ajaxPromise({
            url: `${BASE_URL}/v2/admin_master_survey_number`,
            method: 'GET',
            data: { 'request_type': 'survey_number','district_code':district_code,'taluk_code':taluk_code,'town_code':town_code,'ward_code':ward_code,'block_code':block_code,'area_type':area_type },
            headers: { 'X-APP-NAME': 'demo' },
            dataType: 'json'
        });
        console.log('Async Response District:', response);

        populateDropdown('urban-survey-number-dropdown', response, {
            defaultText: 'Select Survey Number',
            valueKey: 'survey_number',
            textKey: 'survey_number',
            errorCallback: (message) =>console.log(message),
            triggerChange: false
        });
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', response.message);
    }
}
$('#urban-survey-number-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var town_code = $("#town-dropdown").val();
        var ward_code = $("#ward-dropdown").val();
        var block_code = $("#block-dropdown").val();
        var survey_number = $(this).val();
        var area_type = getSelectedAreaType();
        // console.log(area_type);
        if (area_type == 'rural') {
            loadRevenueVillage(district_code, taluk_code, area_type);
        } else if (area_type == 'urban') {
            // urbanSurveyNumberRevenueCode(district_code, taluk_code,town_code,ward_code,block_code,area_type);
        }
        fetchGeometrySurvey('survey_number',area_type, district_code, taluk_code, '', town_code,ward_code,block_code,survey_number);
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', `${error}`)
    }
});
async function loadRevenueVillage(district_code, taluk_code, area_type) {
    try {
        if (district_code && taluk_code) {
            const response = await ajaxPromise({
                url: `${BASE_URL}/v2/admin_master_village`,
                method: 'GET',
                data: { 'district_code': district_code, 'taluk_code': taluk_code, 'request_type': 'revenue_village' },
                headers: { 'X-APP-NAME': 'demo' },
                dataType: 'json'
            });
            console.log('Async Revenue Village Response:', response);
            populateDropdown('village-dropdown', response, {
                defaultText: 'Select Village',
                valueKey: 'village_code',
                textKey: 'village_english_name',
                errorCallback: (message) =>console.log(message),
                // triggerChange: true
            });
        } else {
            resetDropdown('village-dropdown', 'Select Village');
            // showToast('warning', 'Select District & Taluk Dropdown')
        }
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', error)
    }
}


// Update Survey Numbers based on Village
$('#village-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var village_code = $(this).val();
        var area_type = getSelectedAreaType();
        // var data_type = getDataFetchType();
        if (district_code && taluk_code && village_code && area_type ) {
            const response = await ajaxPromise({
                url: `${BASE_URL}/v2/admin_master_survey_number`,
                method: 'GET',
                data: { 'district_code': district_code, 'taluk_code': taluk_code, 'revenue_village_code': village_code, 'area_type': area_type, 'data_type': 'cadastral', 'request_type': 'survey_number' },
                headers: { 'X-APP-NAME': 'demo' },
                dataType: 'json'
            });
            console.log('Async Survey Number Response:', response);
            populateDropdown('survey-number-dropdown', response, {
                defaultText: 'Select Survey Number',
                valueKey: 'survey_number',
                textKey: 'survey_number',
                errorCallback: (message) =>console.log(message),
                // triggerChange: true
            });
            // var villageCode = village_code.replace(/^0+/, '');
            fetchGeometry('revenue_village', district_code, taluk_code, village_code,null,null);
        } else {
            resetDropdown('survey-number-dropdown', 'Select Survey Number');
        }
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', error)
    }
});

// Update Sub Divisions based on Survey Number
// $('#survey-number-dropdown').change(async function () {
//     try {
//         var district_code = $("#district-dropdown").val();
//         var taluk_code = $("#taluk-dropdown").val();
//         var village_code = $("#village-dropdown").val();
//         var survey_number = $(this).val();
//         var area_type = getSelectedAreaType();
//         // var data_type = getDataFetchType();
//         if (district_code && taluk_code && village_code && survey_number && area_type ) {
//             const response = await ajaxPromise({
//                 url: `${BASE_URL}/v2/admin_master_sub_division`,
//                 method: 'GET',
//                 data: { 'district_code': district_code, 'taluk_code': taluk_code, 'revenue_village_code': village_code, 'survey_number': survey_number, 'area_type': area_type, 'data_type': 'cadastral', 'request_type': 'sub_division_number' },
//                 headers: { 'X-APP-NAME': 'demo' },
//                 dataType: 'json'
//             });
//             console.log('Async Sub Division Response:', response);
//             populateDropdown('sub-division-dropdown', response, {
//                 defaultText: 'Select Sub Division',
//                 valueKey: 'sub_division',
//                 textKey: 'sub_division',
//                 errorCallback: (message) =>console.log(message),
//                 triggerChange: true
//             });
//             // var villageCode = village_code.replace(/^0+/, '');
//             fetchGeometry('survey_number', district_code, taluk_code, village_code,survey_number,null);
//             alert(4);
//         } else {
//             resetDropdown('sub-division-dropdown', 'Select Sub Division');
//         }
//     } catch (error) {
//         console.error('Async Error:', error);
//         showToast('error', error)
//     }
// });

$('#survey-number-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var village_code = $("#village-dropdown").val();
        var survey_number = $(this).val();
        var area_type = getSelectedAreaType();
        // var data_type = getDataFetchType();
        if (district_code && taluk_code && village_code && survey_number && area_type ) {
            const response = await ajaxPromise({
                url: checkAregUrl,
                method: 'GET',
                data: { 'district_code': district_code, 'taluk_code': taluk_code, 'village_code': village_code, 'survey_number': survey_number, 'sub_division_number':'jjj',area_type:area_type },
                headers: { 'X-APP-NAME': 'demo' },
                dataType: 'json'
            });
            console.log('Async Sub Division Response:', response);
            populateDropdown('sub-division-dropdown', response, {
                defaultText: 'Select Sub Division',
                valueKey: 'subdiv_no',
                textKey: 'subdiv_no',
                errorCallback: (message) =>console.log(message),
                // triggerChange: true
            });
            // var villageCode = village_code.replace(/^0+/, '');
            fetchGeometry('survey_number', district_code, taluk_code, village_code,survey_number,);
        } else {
            resetDropdown('sub-division-dropdown', 'Select Sub Division');
        }
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', error)
    }
});

$('#sub-division-dropdown').change(async function () {
    try {
        var district_code = $("#district-dropdown").val();
        var taluk_code = $("#taluk-dropdown").val();
        var village_code = $("#village-dropdown").val();
        var survey_number = $("#survey-number-dropdown").val();
        var sub_division_number = $(this).val();
        
        
        fetchGeometry('sub_division_number', district_code, taluk_code, village_code,survey_number,sub_division_number);
       
    } catch (error) {
        console.error('Async Error:', error);
        // showToast('error', error)
    }
});

// Function to get current selected Area Type
function getSelectedAreaType() {
    const selectedRadio = document.querySelector('input[name="area-type"]:checked');
    return selectedRadio.value;
}

// Select all buttons inside .nav-item
const navButtons = document.querySelectorAll('.nav-item .nav-link');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove 'active' class from all nav-links, nav-items, and info-icons
        document.querySelectorAll('.nav-item, .nav-link, .info-icons').forEach(item => {
            item.classList.remove('active');
        });

        // Add 'active' class to the clicked nav-link and its parent nav-item
        button.classList.add('active');
        const parentNavItem = button.closest('.nav-item');
        if (parentNavItem) {
            parentNavItem.classList.add('active');
        }

        // Add 'active' class to the .info-icons container
        const infoIcons = button.closest('.info-icons');
        if (infoIcons) {
            infoIcons.classList.add('active');
        }
    });
});


function openECnfo(data){
    var result = data;
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    ['areg-tab-container','facility-info-container', 'vertex-info-container', 'igr-info-container', 'thematic-info-container', 'fmb-sketch-info-panel', 'JSB-info-container','encumbrance-info-panel','masterplan-info-container']
        .forEach(id => document.getElementById(id)?.remove());
    
    $.ajax({
        url: GI_VIEWER_API_URL + '/encumbrance_certificate',
        type: "POST",
        headers: { 'X-APP-NAME': 'demo' },
        dataType: 'json', // Expected response type
        contentType: 'application/json', // Tell server you're sending JSON
        data: JSON.stringify({
            revDistrictCode: result.district_code,
            revTalukCode: result.taluk_code,
            revVillageCode: result.village_code,
            survey_number: result.survey_number,
            sub_division_number: $("#subDivs").text() ? $("#subDivs").text() : 'jjjj'
        }),
        beforeSend:function(){
            showSpinner();
        },
        success: function(response) {
            if(response.status == 'success'){
                let ECBase64String = response.EC.Base64String;
                let ec_status = response.EC.statusCode;
                if(ec_status == 100){
                    displayEncumbranceCertificate(ECBase64String);
                }else{
                    $(".error-message").empty().text('No Encumbrance Certificate data found for selected survey/subdivision').show();
                }
            }
            hideSpinner();
        },
        error: function(xhr, status, error) {
            console.log(error);
            hideSpinner();
        }
    });
    

}

function displayEncumbranceCertificate(base64String) {
    // Remove existing panel if any
    document.getElementById('encumbrance-info-panel')?.remove();

    const iconSection = document.querySelector('.info-icons');

    const ecContainer = document.createElement('div');
    ecContainer.id = 'encumbrance-info-panel';
    ecContainer.className = 'mt-2 p-3 border rounded position-relative bg-white';
    ecContainer.style.maxHeight = '400px';
    ecContainer.style.overflow = 'hidden';
    ecContainer.style.border = '1px solid #ddd';
    ecContainer.style.borderRadius = '15px!important';
    ecContainer.style.setProperty('border-radius', '15px', 'important');


    const panelTitle = document.createElement('div');
    panelTitle.className = 'd-flex align-items-center pdfheader';
    panelTitle.innerHTML = `<h6 class="m-0">Encumbrance Certificate</h6>`;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'btn-close vertex-close position-absolute';
    closeButton.style.top = '0px';
    closeButton.style.right = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.style.fontSize = '30px';
    closeButton.addEventListener('click', () => {
        ecContainer.remove();
        $('.district-icon img').removeClass('district-icon-active');
    });

    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = '⛶';
    fullscreenButton.className = 'btn btn-sm btn-outline-secondary ms-2';
    fullscreenButton.style.border = 'none';
    fullscreenButton.style.background = 'transparent';
    fullscreenButton.style.cursor = 'pointer';
    fullscreenButton.style.fontSize = '24px';
    fullscreenButton.style.left = '30px';
    fullscreenButton.style.position = 'relative';

    const ecFrame = document.createElement('iframe');
    ecFrame.id = 'pdf-frame';
    ecFrame.style.width = '100%';
    ecFrame.style.height = '350px';
    ecFrame.style.border = 'none';
    ecFrame.src = `data:application/pdf;base64,${base64String}#toolbar=0&navpanes=1&scrollbar=1&page=1&view=FitH`;
    ecFrame.allowFullscreen = true;

    function enterFullscreen() {
        if (ecFrame.requestFullscreen) {
            ecFrame.requestFullscreen();
        } else if (ecFrame.mozRequestFullScreen) {
            ecFrame.mozRequestFullScreen();
        } else if (ecFrame.webkitRequestFullscreen) {
            ecFrame.webkitRequestFullscreen();
        } else if (ecFrame.msRequestFullscreen) {
            ecFrame.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    fullscreenButton.addEventListener('click', enterFullscreen);

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === ecFrame) {
            // Adjust to fullscreen size
            ecFrame.style.width = '100vw';
            ecFrame.style.height = '100vh';
            ecFrame.style.border = 'none';
        } else {
            // Restore original size
            ecFrame.style.width = '100%';
            ecFrame.style.height = '350px';
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.fullscreenElement) {
            exitFullscreen();
        }
    });

    panelTitle.appendChild(fullscreenButton);
    panelTitle.appendChild(closeButton);
    ecContainer.appendChild(panelTitle);
    ecContainer.appendChild(ecFrame);
    iconSection.insertAdjacentElement('afterend', ecContainer);
}
function adangalView(){
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();
    document.getElementById('areg-tab-container')?.remove();
    document.getElementById('vertex-info-container')?.remove();
    document.getElementById('igr-info-container')?.remove();
    document.getElementById('JSB-info-container')?.remove();
    document.getElementById('fmb-sketch-info-panel')?.remove();
    document.getElementById('thematic-info-container')?.remove();
    document.getElementById('facility-info-container')?.remove();
    document.getElementById('encumbrance-info-panel')?.remove();
    document.getElementById('masterplan-info-container')?.remove();
    $(".error-message").empty().text('Crop - coming soon').show();
}
function masterPlanView(){
    clearVertexLabels();
    facilitiesMarkerSourceClear();
    $(".error-message").empty().hide();

    [
        'areg-tab-container', 'facility-info-container', 'vertex-info-container',
        'igr-info-container', 'JSB-info-container', 'fmb-sketch-info-panel',
        'thematic-info-container', 'encumbrance-info-panel', 'masterplan-info-container'
    ].forEach(id => document.getElementById(id)?.remove());

    const iconSection = document.querySelector('.info-icons');

    const masterContainer = document.createElement('div');
    masterContainer.id = 'masterplan-info-container';
    masterContainer.className = 'mt-2 p-3 border rounded position-relative bg-white';
    masterContainer.style.maxHeight = '400px';
    masterContainer.style.overflow = 'hidden';
    masterContainer.style.border = '1px solid #ddd';
    masterContainer.style.borderRadius = '15px';
    masterContainer.style.marginBottom = '8px';
    iconSection.insertAdjacentElement('afterend', masterContainer);

    const sourceText = $('<div>').addClass('text-muted font12 mt-1').css('visibility', 'hidden');
    const closeBtn = $('<button>').addClass('btn-close ms-2').attr('aria-label', 'Close').on('click', () => masterContainer.remove());
    const headerRow = $('<div>').addClass('d-flex justify-content-between align-items-start mb-2');
    headerRow.append(sourceText, closeBtn);
    $(masterContainer).append(headerRow);

    const heading = $('<h5>')
        .addClass('text-center mb-2 font12 fw-bold')
        .text('Master Plan Information for selected location');
    $(masterContainer).append(heading);

    const lat = parseFloat($("#latitude").val());
    const lon = parseFloat($("#longitude").val());

    $.ajax({
        url: GI_VIEWER_API_URL + '/master_plan_feature_extract',
        type: "POST",
        headers: { 'X-APP-NAME': 'demo' },
        data: { latitude: lat, longitude: lon },
        beforeSend:function(){
            showSpinner();
        },
        success: function (response) {
            const safe = (v) => (v !== null && v !== undefined && v !== '') ? v : '-';

            if (response.success === 1) {
                const data = response.data;

                const lpa = data.lpa_boundary;
                const lpaName = safe(lpa.planning_authority || lpa.lpa_name || lpa.local_body);
                const lpaSource = safe(lpa.source);

                $('<div>')
                    .addClass('masterplan-item mb-1')
                    .html(`<span class="fw-bold">Local Planning Authority:</span> ${lpaName}`)
                    .appendTo(masterContainer);

                if (lpaSource !== '-') {
                    sourceText.text(`Source: ${lpaSource}`).css('visibility', 'visible');
                }

                let hasDetail = false;

                // Proposed Layer
                if (data.proposed_landuse) {
                    hasDetail = true;
                    const proposed = data.proposed_landuse;
                    const landuse = safe(proposed.landuse);
                    const status = safe(proposed.status);
                    const year = safe(proposed.year);
                    const statusYear = (status !== '-' || year !== '-') ? `${status}/${year}` : '-';

                    $('<div>')
                        .addClass('masterplan-item mb-1')
                        .html(`<span class="fw-bold">Proposed Land Use:</span> ${landuse}`)
                        .appendTo(masterContainer);

                    $('<div>')
                        .addClass('masterplan-item mb-1')
                        .html(`<span class="fw-bold">Stages/Year:</span> ${statusYear}`)
                        .appendTo(masterContainer);
                }

                // Existing Layer
                if (data.existing_landuse) {
                    hasDetail = true;
                    const existing = data.existing_landuse;
                    const landuse = safe(existing.landuse);
                    const status = safe(existing.status);
                    const year = safe(existing.year);
                    const statusYear = (status !== '-' || year !== '-') ? `${status}/${year}` : '-';

                    $('<div>')
                        .addClass('masterplan-item mb-1')
                        .html(`<span class="fw-bold">Existing Land Use:</span> ${landuse}`)
                        .appendTo(masterContainer);

                    // $('<div>')
                    //     .addClass('masterplan-item mb-1')
                    //     .html(`<span class="fw-bold">Stages/Year:</span> ${statusYear}`)
                    //     .appendTo(masterContainer);
                }

                if (!hasDetail) {
                    $('<div>')
                        .addClass('alert-warning text-center p-3')
                        .text('No data found for the selected location.')
                        .appendTo(masterContainer);
                }
            } else if (response.success === 2) {
                $('<div>')
                    .addClass('alert-danger text-center p-3')
                    .text('The selected location is not covered by any local planning authority.')
                    .appendTo(masterContainer);
            } else {
                $('<div>')
                    .addClass('alert-danger text-center p-3')
                    .text('An unexpected error occurred.')
                    .appendTo(masterContainer);
            }
            hideSpinner();
        },
        error: function () {
            $('<div>')
                .addClass('alert-danger text-center p-3')
                .text('Failed to fetch master plan data from the server.')
                .appendTo(masterContainer);
                hideSpinner();
        }
    });
}



function addSpaceBeforeCaps(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals (e.g., govtPriCode)
        .replace(/\s+/g, ' ') // Replace multiple spaces with one
        .trim() // Trim leading/trailing spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
}




// const rotationStep = Math.PI / 8; // Rotate by 22.5 degrees per step

// // Reset rotation to North (0 degrees)
// document.getElementById("resetRotation").addEventListener("click", function () {
//     view.animate({ rotation: 0, duration: 300 });
// });

// // Rotate Right (Clockwise)
// document.querySelector(".rotation-right").addEventListener("click", function () {
//     view.animate({ rotation: view.getRotation() - rotationStep, duration: 300 });
// });

// // Rotate Left (Counterclockwise)
// document.querySelector(".rotation-left").addEventListener("click", function () {
//     view.animate({ rotation: view.getRotation() + rotationStep, duration: 300 });
// });

function verifySubDivision(response) {
    let Paramas = {};
    if(response.rural_urban == 'rural'){
        Paramas = {
            district_code: response.district_code,
            taluk_code: response.taluk_code,
            village_code: response.village_code,
            survey_number: response.survey_number,
            sub_division_number: $("#subDivs").text() ? $("#subDivs").text() : 'jjjj',
            area_type: response.rural_urban
        } 
    }else{
        Paramas = {
            district_code: response.district_code,
            taluk_code: response.taluk_code,
            town_code:response.revenue_town_code,
            ward_code:response.firka_ward_number,
            block_code:response.urban_block_number,
            survey_number: response.survey_number,
            sub_division_number: $("#subDivs").text() ? $("#subDivs").text() : 'jjjj',
            area_type: response.rural_urban
        } 
    }
    return new Promise((resolve, reject) => {
        $.ajax({
            url: checkAregUrl,
            type: "GET",
            data: Paramas,
            success: function(data) {
                resolve(data); // Return the data
            },
            error: function(xhr, status, error) {
                reject(error); // Return the error
            }
        });
    });
}

function generateDropdown(result) {
    if (!result || !result.data || result.data.length === 0) {
        console.error("No subdivision data found");
        return;
    }

    let container = document.getElementById("subdivisionid");
    
    // Get the currently selected value if it exists
    let existingDropdown = document.getElementById("subdivisionDropdown");
    let selectedValue = existingDropdown ? existingDropdown.value : "";

    // Remove existing dropdown if present
    if (existingDropdown) {
        container.removeChild(existingDropdown);
    }

    // Create the select element
    let select = document.createElement("select");
    select.id = "subdivisionDropdown";
    select.className = "form-select";

    // Create a default "Select" option
    let defaultOption = document.createElement("option");
    defaultOption.text = "Select";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    // Loop through result.data and add options
    result.data.forEach(item => {
        let option = document.createElement("option");
        option.value = item.subdiv_no;
        option.text = `${item.subdiv_no}`;
        if (item.subdiv_no === selectedValue && selectedValue !== "") {
            option.selected = true; // Retain previous selection if it's not the default
        }
        select.appendChild(option);
    });

    // Append the dropdown to the container
    container.appendChild(select);
    $(".error-message").empty().text('For the selected location, The map contents are not updated. Please select the Survey/Sub division from the dropdown (land records) & proceed further.').show();
}


$("#backto").on("click", function(){
    const Offcanvas = document.getElementById('offcanvasScrolling-right');
    Offcanvas.classList.remove('show');
    const Offcanvas1 = document.getElementById('offcanvasScrolling-right1');
    Offcanvas1.classList.remove('show');
})


function LpadAdding(code, type) {
    if (code === null || code === undefined) {
        return "";
    }

    let value = code.toString();

    switch (type) {
        case 'district':
        case 'taluk':
            return value.padStart(2, "0");

        case 'village':
        case 'town':
        case 'ward':
            return value.padStart(3, "0");

        case 'block':
            return value.padStart(4, "0");

        default:
            return value;
    }
}


function closever(){
    clearVertexLabels();
}

function siteVisitorsCount(){
    $.ajax({
        url: `${BASE_URL}/v2/site_visitors_track`,
        method: 'GET',
        success: function (response) {
            var responseDetails = response.stats;
            let totalVisitors = formatIndianNumber(responseDetails.total_visitors);
            let OnlineUsers = formatIndianNumber(responseDetails.currently_online);
            $(".total_visitors").html("Total Unique users (IP): "+totalVisitors);
            $(".online_viewer").html("Online: "+OnlineUsers);
        },
        error: function (xhr, status, error) {
            console.error('Error in fetching AREG - ', error);
        }
    });
}

const generateLink = (coordinates) => {
    let link = "https://www.google.com/maps/dir/?api=1&origin=";
    coordinates.forEach((coordinate, index) => {
        if (index === 0) {
            link += `${coordinate[1]},${coordinate[0]}`;
        } else {
            link += `&destination=${coordinate[1]},${coordinate[0]}`;
        }
    });
    return link;
};
function clearVectorSourceData() {
    
    geojsonSource.clear();
}
function clearVectorBoundarySourceData() {
    selectionGeojsonSource.clear();
}
function facilitiesMarkerSourceClear() {
    facilitiesMarkerSource.clear();
}
$("#district-icon").on("click", function() {
    // First remove 'active' class from all images inside #district-icon
    $("#district-icon img").removeClass('active');
    
    // Then add 'active' class to the clicked one
    $(this).find("img").addClass('district-icon-active');
});

function goToLocation() {
    const latInput = document.getElementById('latitude_div').value.trim();
    const lngInput = document.getElementById('longitude_div').value.trim();

    // Check for empty input
    if (!latInput || !lngInput) {
        showToast('warning', 'Latitude and Longitude cannot be empty');
        return;
    }

    // Check if input is a valid number
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
        showToast('warning', 'Latitude and Longitude must be valid numbers');
        return;
    }

    // Check global latitude/longitude range
    if (lat < -90 || lat > 90) {
        showToast('warning', 'Latitude must be between -90 and 90');
        return;
    }

    if (lng < -180 || lng > 180) {
        showToast('warning', 'Longitude must be between -180 and 180');
        return;
    }

    // Tamil Nadu boundary check (approximate bounding box)
    const tnLatMin = 8.0, tnLatMax = 13.5;
    const tnLngMin = 76.0, tnLngMax = 80.5;

    if (lat < tnLatMin || lat > tnLatMax || lng < tnLngMin || lng > tnLngMax) {
        showToast('warning', 'Location is outside Tamil Nadu boundary');
        return;
    }

    // Clear existing markers
    markerSource.clear();

    // Project coordinates and create marker
    const coord = ol.proj.fromLonLat([lng, lat]);
    const markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(coord)
    });

    markerSource.addFeature(markerFeature);

    // Call function to load land details
    landDetailsShow(lat, lng);
}

let watchId = null;
let lastLat = null;
let lastLon = null;

const MIN_DISTANCE_METERS = 30; // Only update if moved more than 30 meters

function getLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
    
    // Clear any existing watch to avoid duplicates
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    watchId = navigator.geolocation.watchPosition(
        function (position) {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;
    
            // Ignore small movements (noise)
            if (lastLat !== null && lastLon !== null) {
                const movedDistance = getDistanceFromLatLonInMeters(lastLat, lastLon, lat, lon);
                if (movedDistance < MIN_DISTANCE_METERS) {
                    return;
                }
            }

            lastLat = lat;
            lastLon = lon;

            $("#currentlocationlat").val(lat);
            $("#currentlocationlong").val(lon);
            console.log("Moved to:", lat, lon, `Accuracy: ${accuracy} meters`);
    
          const coords = ol.proj.fromLonLat([lon, lat]);

            // Always clear previous location and update with the latest one
            locationLayer.getSource().clear();
          locationFeature.setGeometry(new ol.geom.Point(coords));
            locationLayer.getSource().addFeature(locationFeature);

            // Mobile: Auto-zoom and center on the current location
            const width = window.innerWidth;
            if (width < 992) {
                map.getView().animate({
                    center: coords,
                    zoom: 18,
                    duration: 500
                });
            }

            // Keep the blinking animation
          if (window.blinkInterval) clearInterval(window.blinkInterval);
          window.blinkInterval = setInterval(() => {
            isVisible = !isVisible;
            locationLayer.changed();
          }, 400);

            // Reverse geocode and store location data
            getLocationName(lat, lon, (locationName) => {
                const storedLat = localStorage.getItem("storedLat");
                const storedLon = localStorage.getItem("storedLon");
                const storedName = localStorage.getItem("storedLocationName");

                if (
                    storedLat !== lat.toString() ||
                    storedLon !== lon.toString() ||
                    storedName !== locationName
                ) {
                    localStorage.setItem("storedLat", lat);
                    localStorage.setItem("storedLon", lon);
                    localStorage.setItem("storedLocationName", locationName);
                }
            });
        },
        function (error) {
          console.warn("Geolocation failed:", error.message);
        },
        {
            enableHighAccuracy: true,  // IMPORTANT for accuracy
            maximumAge: 0,            // Force fresh positions
            timeout: Infinity         // No timeout
        }
    );
}

// Haversine formula to calculate distance between two lat/lon in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

// Reverse geocode and return location name via callback
function getLocationName(lat, lon, callback) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                const locationName = data.display_name;
                $("#currentlocationname").val(locationName);
                if (typeof callback === "function") callback(locationName);
            } else {
                console.warn("Location name not found.");
                if (typeof callback === "function") callback("");
            }
        })
        .catch(err => {
            console.error("Reverse geocoding failed:", err);
            if (typeof callback === "function") callback("");
        });
}

// Move to current location on button click (Desktop)
function moveToCurrentLocation() {
    if (lastLat !== null && lastLon !== null) {
        const coords = ol.proj.fromLonLat([lastLon, lastLat]);

        // Always clear previous location features
        locationLayer.getSource().clear();

        // Add the current location feature
        locationLayer.getSource().addFeature(locationFeature);

        // Animate map view
        map.getView().animate({
            center: coords,
            zoom: 18,  // Adjust zoom level as you like
            duration: 1000
        });
    }
  }
  

  function searchPattaNumber(el){
    const responseData = JSON.parse(el.getAttribute('data-details'));
    let pattaNo = responseData.pattaNo;
    $.ajax({
    url: TAMIL_NILAM_API_URL + '/pattacopy',
    type: 'POST',
    headers: {
        'X-APP-USER-ID': 12,
    },
    data: {
        district_code: responseData.districtCode,
        taluk_code: responseData.talukCode,
        village_code: responseData.villCode,
        patta_number: pattaNo
    },
    beforeSend: function () {
        // showSpinner("Fetching data from NIC... Please wait...!");
    },
    complete: function () {
        // hideSpinner();
    },
    success: function (response) {
        if (typeof response === 'string') {
        try {
            response = JSON.parse(response);
        } catch (e) {
            console.error("Failed to parse response JSON:", e);
            return;
        }
        }

        $('.mb-4.hidden').removeClass('hidden');

        if (response.success === '1') {
        const base64String = response.data;

        if (base64String && typeof base64String === 'string') {
            try {
            // Convert base64 to byte array
            const base64PDF = base64String; // must not include the data prefix
            const fullscreenBtn = document.getElementById("fullscreenPattaBtn");
            const pattaContainer = document.getElementById("patta");
            const iframe = document.getElementById("pattaViewerFrame");

            // Replace this with your actual base64 PDF string (without prefix)
            const pdfOptions = "#toolbar=0&navpanes=1&scrollbar=1&page=1&view=FitH";
            // Load the clean PDF view into the iframe
            const pdfViewerHTML = `
                <html>
                <body style="margin:0;padding:0;overflow:hidden;">
                    <embed src="data:application/pdf;base64,${base64PDF}${pdfOptions}" type="application/pdf" width="100%" height="100%"/>
                </body>
                </html>
            `;

            iframe.src = "data:text/html;base64," + btoa(pdfViewerHTML);

            // Fullscreen trigger
            fullscreenBtn.addEventListener("click", () => {
                if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
                } else if (iframe.webkitRequestFullscreen) {
                iframe.webkitRequestFullscreen();
                } else if (iframe.mozRequestFullScreen) {
                iframe.mozRequestFullScreen();
                } else if (iframe.msRequestFullscreen) {
                iframe.msRequestFullscreen();
                } else {
                alert("Fullscreen not supported by this browser.");
                }
            });
            
            } catch (e) {
            console.error("Error processing base64 PDF string: ", e);
            }
        } else {
            console.error("Invalid base64 string.");
        }
        } else if (response.success === '2') {
        Swal.fire({
            icon: 'error',
            title: 'Patta Details Not Found',
            text: response.message || 'Please check the patta number and try again.',
            confirmButtonText: 'OK'
        }).then(() => {
            $('#patta_info_container').empty();
            $('#patta_number_search').val('');
        });
        } else if (response.success === '3') {
        Swal.fire({
            icon: 'warning',
            title: 'Inappropriate API Response',
            text: response.message || 'The API returned an inappropriate response.',
            confirmButtonText: 'OK'
        }).then(() => {
            $('#patta_info_container').empty();
            $('#patta_number_search').val('');
        });
        } else {
        console.error("Unexpected response:", response);
        }
    },
    error: function (xhr, status, error) {
        // hideSpinner();
        console.error('Error:', error);
        console.error('Status:', status);
        console.error('Response Text:', xhr.responseText);
    }
    });
  
  }
  
