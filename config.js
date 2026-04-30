const BASE_URL = "/api/generic_api";
const GI_VIEWER_API_URL = "/api/gi_viewer_api/api";
const GEOSERVER_URL = '/api/wms';
const checkAregUrl = '/api/generic_api/v1/check_Areg';
const ADMIN_CODE_TYPE = 'revenue';
const AREG_SEARCH_TYPE = 'survey_number';
const AREG_SEARCH_URL = '/api/tamilnilam_api/v1/tamil_nillam_ownership';
const TAMIL_NILAM_API_URL = '/api/tamilnilam_api/v1';
const FMB_SKETCH_URL = '/api/generic_api/v1/sketch_fmb';
const IGR_SERVICE_LAYER_NAME = 'Thematic_XYZ';
const IGR_URL = '/api/thematic_viewer_api/v1/getfeatureInfo';
const POPULATION_URL = '/api/thematic_viewer_api/v1/getfeatureinfo_population';
const jsonFilePath = './assets/js/layerConfig.json';
const thematicJsonFilePath = './assets/js/thematicLayerConfig.json';

// Configuration
toastr.options = {
    "closeButton": true,
    "debug": true,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}

function showToast(type, message) {
    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        case 'info':
            toastr.info(message);
            break;
    }
}

// Modern ES6 Promise wrapper
function ajaxPromise(options) {
    return new Promise((resolve, reject) => {
        $.ajax({
            ...options,
            success: resolve,
            error: reject
        });
    });
}

/**
 * Populates a dropdown with sorted options from an API response
 * @param {string} dropdownId - The ID of the select element to populate
 * @param {Object} response - The API response object
 * @param {Object} config - Configuration object for the dropdown
 * @param {string} config.defaultText - Text for the default option (e.g., "Select Taluk")
 * @param {string} config.valueKey - The key in data object to use as option value (e.g., "taluk_code")
 * @param {string} config.textKey - The key in data object to use as option text (e.g., "taluk_english_name")
 * @param {Function} [config.sortFunction] - Optional custom sort function
 * @param {Function} [config.errorCallback] - Optional error callback function
 */
function populateDropdown(dropdownId, response, config) {
    const selectElement = document.getElementById(dropdownId);
    if (!selectElement) {
        console.error(`Dropdown with id "${dropdownId}" not found`);
        return;
    }

    const defaultConfig = {
        defaultText: 'Select Option',
        valueKey: 'id',
        textKey: 'name',
        sortFunction: (a, b) => a[config.textKey].localeCompare(b[config.textKey]),
        errorCallback: (message) => console.error(message),
        triggerChange: false,
        preselectValue: null,
        onComplete: null
    };

    config = { ...defaultConfig, ...config };

    selectElement.innerHTML = `<option value="" disabled selected>${config.defaultText}</option>`;

    if ((response.success === 1 || response.success === 2) && response.data?.length > 0 ) {
        const sortedData = [...response.data].sort(config.sortFunction);

        sortedData.forEach(item => {
            const option = document.createElement('option');
            option.value = item[config.valueKey];
            option.textContent = item[config.textKey];

            if (item[config.valueKey] == config.preselectValue) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });

        // Only dispatch change if triggerChange is true AND there is NO preselected value
        if (config.triggerChange && !config.preselectValue) {
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
        }

        // Always run onComplete if it's a function
        if (typeof config.onComplete === 'function') {
            config.onComplete();
        }
    } else {
        config.errorCallback(response.message);
    }
}

function resetDropdown(dropdownId, defaultText) {
    const selectElement = document.getElementById(dropdownId);
    if (!selectElement) {
        console.error(`Dropdown with id "${dropdownId}" not found`);
        return;
    }
    // Set default option
    selectElement.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;

    // Create and dispatch the change event
    const event = new Event('change', {
        bubbles: true,
        cancelable: true,
    });
    selectElement.dispatchEvent(event);
}
function formatIndianNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
}
