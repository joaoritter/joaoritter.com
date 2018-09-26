
(function($) {

    let map = [];
    let packQueue = [];
    let isPacking = false;
    let startingI = 0;

    $.fn.curate = function() {
        const CLASS_NAME = "queued";

        let newChildren = $(this).children().not("." + CLASS_NAME);
        packQueue = packQueue.concat(newChildren.toArray());
        newChildren.addClass(CLASS_NAME);

        if (isPacking) { 
            return; 
        }

        isPacking = true;
        pack({ 
            map
        }, function(updatedMap) { 
            map = updatedMap;
            isPacking = false;
        });
    };


    function pack({ map }, callback) {
        if (packQueue.length == 0) {
            callback(map);
            return;
        } 

        let $item = $(packQueue[0]); 
        packQueue.shift();

        const ITEM_X_MIN = Math.ceil($item.offset().left);
        const ITEM_X_MAX = Math.floor(ITEM_X_MIN + $item.outerWidth());

        const ITEM_Y_MIN = Math.ceil($item.offset().top);
        const ITEM_Y_MAX = Math.floor(ITEM_Y_MIN + $item.outerHeight());

        const ITEM_HEIGHT = ITEM_Y_MAX - ITEM_Y_MIN;

        let packHeight = 0;
        let ceilingMapEntry;
        let updatedMap = [];

        for (let i = 0; i < map.length; i++) {

            let mapEntry = map[i];

            if (ITEM_X_MIN <= mapEntry.xMin && ITEM_X_MAX >= mapEntry.xMax) {  
                if (ceilingMapEntry == undefined || mapEntry.packHeight > ceilingMapEntry.packHeight) {
                    ceilingMapEntry = mapEntry;
                }
                continue; 
            }

            ///if the new element starts within mapEntry.
            if (ITEM_X_MIN >= mapEntry.xMin && ITEM_X_MIN <= mapEntry.xMax) {
                ///if the new element is entirely within mapEntry.
                if (ITEM_X_MAX <= mapEntry.xMax) {

                    ///set the ceiling.
                    ceilingMapEntry = mapEntry; 

                    ///add tail end of mapEntry to updateMap.
                    if (ITEM_X_MAX < mapEntry.xMax) {
                        updatedMap.push({
                            xMin: ITEM_X_MAX + 1,
                            xMax: mapEntry.xMax,
                            packHeight: mapEntry.packHeight
                        });
                    }

                ///not fully contained, meaning packHeight should be set to the max.
                } else if (ceilingMapEntry == undefined || mapEntry.packHeight > ceilingMapEntry.packHeight) {
                    ceilingMapEntry = mapEntry;
                }

                ////if there is a leftover beginning, add it to updated maps.
                if (ITEM_X_MIN > mapEntry.xMin) {
                    updatedMap.push({
                        xMin: mapEntry.xMin,
                        xMax: ITEM_X_MIN - 1,
                        packHeight: mapEntry.packHeight
                    });
                }

            } else if (ITEM_X_MAX >= mapEntry.xMin && ITEM_X_MAX <= mapEntry.xMax) {
                if (ceilingMapEntry == undefined || mapEntry.packHeight > ceilingMapEntry.packHeight) {
                    ceilingMapEntry = mapEntry;
                }

                if (ITEM_X_MAX < mapEntry.xMax) {
                    updatedMap.push({
                        xMin: ITEM_X_MAX,
                        xMax: mapEntry.xMax,
                        packHeight: mapEntry.packHeight
                    });
                }

            ///the new item doesn't affect the map entry.
            } else {
                updatedMap.push(mapEntry); 
            }
        }

        let offset;
        //If there is no ceiling, set the ceiling
        if (ceilingMapEntry == undefined) {
            ///add new item to updateMap.
            updatedMap.push({
                xMin: ITEM_X_MIN,
                xMax: ITEM_X_MAX,
                packHeight: ITEM_Y_MAX
            });
            offset = 0;
        } else {
            ///add new item to updateMap.
            updatedMap.push({
                xMin: ITEM_X_MIN,
                xMax: ITEM_X_MAX,
                packHeight: ceilingMapEntry.packHeight + ITEM_HEIGHT 
            });
            offset = ceilingMapEntry.packHeight - ITEM_Y_MIN;
        }


        let params = {
            opacity: 1,
            marginTop: offset
        }

        animateIn(
            { 
                $item, 
                params
            }, function() {
                pack({ map: updatedMap }, callback);
            }
        );
    }

    function animateIn({ $item, params }, callback) {
      $item.css('z-index', 'auto').stop().animate(
        params,
        600, 
        'swing', 
        callback
      );
    }

})(jQuery);
