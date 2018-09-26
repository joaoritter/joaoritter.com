//Global options
let pageNumber = 1;
let pageSize = 20;
let stopPaging = false;
let loadingPhotos = false;

$(document).ready(function() {
    curateGallery();
    setupPageWatcher();
});

function curateGallery() {
    loadingPhotos = true;
    getPhotos(function(photos) {
        loadingPhotos = false;
        let photoGallerySelector = '#photoContainer';
        let gallery = $(photoGallerySelector);
        let imgsHtml = photos.join("");
        gallery.append(imgsHtml);

        ///delay so first image has time to resolve height;
        setTimeout(function() {
            gallery.curate();
        }, 500);
    });
}

function setupPageWatcher() {
    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() > $(document).height() - 2*$(window).height()) {
            if (stopPaging || loadingPhotos) return;
            curateGallery();
        }
    }); 
}

function getPhotos(callback) {
    const EXTRAS = 'url_c, description, date_upload';
    const URL = 'https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=' + config.flickr.key + 
        '&user_id=' + config.flickr.userId + 
        '&extras=' + EXTRAS + 
        '&per_page=' + pageSize + 
        '&page=' + pageNumber + 
        '&format=json&nojsoncallback=1';

    $.getJSON(URL, function(data) { 
        if (data.code == 1) {  
            return;
        }
        if (data.photos.total > pageSize * pageNumber) {
            pageNumber++;
        } else {
            stopPaging = true; 
        }

        let photos = []; 
        let photoObjs = data.photos.photo
        $.each(photoObjs, function(key, photoObj) {
            let date = '<span class="date">' + moment.unix(photoObj.dateupload).fromNow() + '</span>';

            let size = generateSize({height: photoObj.height_c, width: photoObj.width_c});
            let image = '<img src="' + buildPhotoURL(photoObj) + '" alt="" width="' + size + 'px"/>'; 

            let contents = date;
            if (photoObj.description != undefined && photoObj.description._content != undefined && photoObj.description._content != "") {
                contents += '<a href="' + $(photoObj.description._content).attr('href') + '" target="_blank">' + image + '</a>'; 
            } else {
                contents += image; 
            }

            let imageContainer = '<div id="' + photoObj.id + '" class="imageContainer">' + contents + '</div>';
            photos.push(imageContainer);
        });
        callback(photos) 
    })
}

function buildPhotoURL(photo) {
    let url = 'https://farm' + photo.farm + 
        '.staticflickr.com/' + photo.server + 
        '/' + photo.id + '_' + 
        photo.secret + '_b.jpg';
    return url;
}

function generateSize({ dimensionRatio }) {
    let windowWidth = $(window).width();
    let windowHeight = $(window).height();

    let random = Math.random()

    if (windowWidth > 2000) {
        if (random < .2) { size = 500 } //20% 500px
        else if (random < .4) { size = 600 } //20% 600px
        else if (random < .6) { size = 640 } //20% 640px
        else if (random < .7) { size = 720 } //10% 720px
        else if (random < .9) { size = 800 } //10% 800px
        else { size = 1024 } //10% 1024px
    } else if (windowWidth > 1100) {
        if (random < .1) { size = 400 } //10% 400px
        else if (random < .2) { size = 440 } //20% 440px
        else if (random < .5) { size = 480 } //20% 480px
        else if (random < .7) { size = 500 } //20% 500px
        else if (random < .8) { size = 640 } //10% 640px
        else { size = 800 } //20% 800px
    } else if (windowWidth > 810) {
        if (random < .3) { size = 320 } //30% 320px
        else if (random < .4) { size = 400 } //10% 400px
        else if (random < .7) { size = 440 } //30% 440px
        else if (random < .9) { size = 500 } //20% 500px
        else { size = 640 } //10% 640px
    } else if (windowWidth > 650) {
        size = 640 //100% 640px
    } else if (window_width > 510) {
        size = 500 //100% 500px
    } else {
        size = 320 //100% 320px
    }

    if (dimensionRatio == undefined) {
        return size; 
    }

    const RATIO = size / width;
    const MIN_HEIGHT = 65;
    const MAX_HEIGHT = windowHeight * 0.8;

    if (height * RATIO < MIN_HEIGHT) {
        size = MIN_HEIGHT * dimensionRatio;  
    }
    if (height * RATIO > MAX_HEIGHT) {
        size = MAX_HEIGHT * dimensionRatio;  
    }

    return size;
}
