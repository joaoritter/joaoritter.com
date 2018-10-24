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
    
        delayUntilAllImagesHaveLoaded({  
            timeout: 5000,
            inSelector: photoGallerySelector
        }, function(completed) {
            ///show title.
            if (!completed && pageNumber == 2) {
                $("#photoContainerTitle").css("opacity", 0);     
            }
            gallery.curate();
        });
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
        if (random < .1) { size = 300 } //10% 300px
        else if (random < .2) { size = 340 } //20% 340px
        else if (random < .5) { size = 400 } //20% 400px
        else if (random < .7) { size = 440 } //20% 440px
        else if (random < .8) { size = 500 } //10% 500px
        else { size = 640 } //20% 640px
    } else if (windowWidth > 810) {
        if (random < .3) { size = 320 } //30% 320px
        else if (random < .4) { size = 400 } //10% 400px
        else if (random < .7) { size = 440 } //30% 440px
        else if (random < .9) { size = 500 } //20% 500px
        else { size = 640 } //10% 640px
    } else if (windowWidth > 650) {
        size = 640 //100% 640px
    } else if (windowWidth > 510) {
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

///from https://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-in-javascript
function delayUntilAllImagesHaveLoaded({ timeout, inSelector } = {}, callback) {

    let calledBack = false;

    if (timeout != undefined) {
        setTimeout(function() {
            if (calledBack) return;
            calledBack = true;
            callback(false); 
        }, timeout);
    }
    
    checkContinuouslyForImageLoad({
        inSelector,
        timeout
    }, function(finished) {
        if (calledBack) return;   
        calledBack = true;
        callback(finished);
    });
}

function checkContinuouslyForImageLoad({ timeout=10000, inSelector, i=0 }, callback) {
    const DELAY = 500;
    
    ///make sure it doesnt run forever..
    if (timeout < DELAY * i) {
        return callback(false);
    }

    i++;

    let $images = $(inSelector + " img");
    for(i = 0; i < $images.length; i++) {
        let img = $images[i];
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            setTimeout(function() {
                checkContinuouslyForImageLoad({ timeout, inSelector, i }, callback);
            }, DELAY);
            return;
        }

        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.
        if (img.naturalWidth === 0) {
            setTimeout(function({ timeout, inSelector, i }, callback) {
                checkContinuouslyForImageLoad();
            }, DELAY);
            return;
        }
    };
    callback(true);
}


