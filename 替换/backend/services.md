# 函数名替换映射表

| 原函数名                                           | 新函数名                  |
| -------------------------------------------------- | ------------------------- |
| `callZhipuAI` (advisorService)                   | `aiCall`                |
| `needsSpotData`                                  | `needSpot`              |
| `getSpotsFromDatabase`                           | `loadSpots`             |
| `formatSpotsForPrompt`                           | `fmtSpots`              |
| `answerQuestion`                                 | `answer`                |
| `buildSystemPrompt`                              | `sysPrompt`             |
| `callZhipuAI` (agentService)                     | `aiCall`                |
| `getTools`                                       | `getTools`              |
| `checkMissingTripParams`                         | `chkParams`             |
| `generateParamQuestion`                          | `askParam`              |
| `validateCreateTripParams`                       | `chkTripParams`         |
| `cleanBlogContent`                               | `cleanBlog`             |
| `checkIfConfirmAction`                           | `chkConfirm`            |
| `parsePreferences` (agentService)                | `readPrefs`             |
| `parseLatitude`                                  | `parseLat`              |
| `parseLongitude`                                 | `parseLng`              |
| `inferDestination`                               | `guessDest`             |
| `inferDates`                                     | `guessDates`            |
| `inferDays`                                      | `guessDays`             |
| `inferBudget`                                    | `guessBudget`           |
| `inferTravelers`                                 | `guessTravelers`        |
| `inferPreferences` (agentService)                | `guessPrefs`            |
| `formatError`                                    | `fmtErr`                |
| `confirmTrip`                                    | `saveTrip`              |
| `confirmBlogPublish`                             | `confirmPost`           |
| `cancelDraft`                                    | `dropDraft`             |
| `parseAiResponse`                                | `parseAI`               |
| `getHealthLevel`                                 | `healthLevel`           |
| `getFromCache`                                   | `fromCache`             |
| `saveToCache`                                    | `toCache`               |
| `getCacheStats`                                  | `cacheInfo`             |
| `getAttractionsByType`                           | `byType`                |
| `getRestaurants`                                 | `loadDining`            |
| `getScenicSpots`                                 | `loadScenic`            |
| `getTouristAttractions`                          | `loadAttractions`       |
| `getAllAttractions`                              | `allSpots`              |
| `deduplicateAttractions`                         | `uniqSpots`             |
| `parseLocation` (amapService)                    | `parseLoc`              |
| `calculateDistance` (amapService)                | `calcDist`              |
| `toRadians` (amapService)                        | `toRad`                 |
| `addBlog`                                        | `newBlog`               |
| `fetchPosts`                                     | `fetchPosts`            |
| `loadBlogId`                                     | `getPost`               |
| `incViews`                                       | `bumpView`              |
| `updBlog`                                        | `editPost`              |
| `delBlog`                                        | `delBlog`               |
| `blogLike`                                       | `Like`                  |
| `addCmt`                                         | `cmtAdd`                |
| `delCmt`                                         | `removeCmt`             |
| `likeCmt`                                        | `cmtLike`               |
| `hotTags`                                        | `hotTags`               |
| `calculateActualBudget`                          | `calcActual`            |
| `calculateEstimatedBudget`                       | `estBudget`             |
| `estimateHotelPrice`                             | `estHotel`              |
| `estimateRestaurantPrice`                        | `estFood`               |
| `calculateTransportationCost`                    | `calcTrans`             |
| `budgetStats` (budgetCalculator)                 | `budgetStats`           |
| `getWarningLevel`                                | `warnLevel`             |
| `getWarningMessage`                              | `warnMsg`               |
| `calculateBudget`                                | `calcBudget`            |
| `getCityTier`                                    | `cityLevel`             |
| `getSeason`                                      | `getSeason`             |
| `calculateTickets`                               | `calcTickets`           |
| `createBudgetRecord`                             | `addBudget`             |
| `adjustTotalBudget`                              | `modBudget`             |
| `updPrice`                                       | `adjustPrice`           |
| `budgetLog`                                      | `budgetLog`             |
| `getRealTimeBudget`                              | `liveBudget`            |
| `getCategoryName` (budgetTrackingService)        | `catName`               |
| `createSession`                                  | `newSession`            |
| `updateSessionState`                             | `updState`              |
| `updateSessionTempData`                          | `setTemp`               |
| `clearSessionTempData`                           | `clearTemp`             |
| `getSession`                                     | `getChat`               |
| `getOrCreateAdvisorSession`                      | `advisorSession`        |
| `getOrCreateAgentSession`                        | `agentSession`          |
| `createMessage`                                  | `newMsg`                |
| `msgs` (chatHistoryService)                      | `fetchMsgs`             |
| `userSessions`                                   | `listChats`             |
| `delSession`                                     | `dropChat`              |
| `getSessionWithMessages`                         | `chatWithMsgs`          |
| `imgUpload` (cloudinaryService)                  | `phshImg`               |
| `delImg` (cloudinaryService)                     | `delImg`                |
| `getOptimizedUrl`                                | `getUrl`                |
| `checkImageExists`                               | `hasImg`                |
| `getImageInfo`                                   | `getImg`                |
| `kMeansClustering`                               | `KMeans`                |
| `selectInitialCenters`                           | `initCenters`           |
| `assignToClusters`                               | `assign`                |
| `recalculateCenters`                             | `recalcCenters`         |
| `hasConverged`                                   | `converged`             |
| `balanceClusters`                                | `evenOut`               |
| `parseLocation` (clusteringService)              | `parseLoc`              |
| `calculateDistance` (clusteringService)          | `calcDist`              |
| `toRadians` (clusteringService)                  | `toRad`                 |
| `createRoom`                                     | `newRoom`               |
| `joinRoom`                                       | `enterRoom`             |
| `getRoomInfo`                                    | `roomInfo`              |
| `spotStats`                                      | `spotStats`             |
| `closeRoom`                                      | `lock`                  |
| `saveDraft`                                      | `saveDraft`             |
| `sendDraft`                                      | `pushDraft`             |
| `myDrfts`                                        | `myDrafts`              |
| `msgSend`                                        | `sendMsg`               |
| `msgs` (collabService)                           | `loadMsgs`              |
| `isHost`                                         | `isHost`                |
| `isMember`                                       | `isMember`              |
| `calculateTotalSpotsNeeded`                      | `totalSpots`            |
| `parsePreferences` (constraintAwarePlanner)      | `prefs`                 |
| `isWeekendOrHoliday`                             | `isHoliday`             |
| `getCurrentHour`                                 | `nowHour`               |
| `calculateTimeSlotFactor`                        | `timeFactor`            |
| `getSpotHeatCoefficient`                         | `heatCoef`              |
| `calculateWaitTime`                              | `calWait`               |
| `calculateIsOpen`                                | `isOpen`                |
| `getBatchCrowdData`                              | `batchCrowd`            |
| `updateSpotIoTData`                              | `spotIoTUpd`            |
| `applyDiversityConstraints`                      | `diversify`             |
| `canAddSpot`                                     | `spotOK`                |
| `checkDiversity`                                 | `chkDiv`                |
| `sense`                                          | `sense`                 |
| `isOutdoorAttraction` (environmentSensorService) | `isOutdoor`             |
| `logSensorResult`                                | `logSense`              |
| `logSensorResults`                               | `logMany`               |
| `determineErrorType`                             | `errorKind`             |
| `determineErrorSeverity`                         | `errServerity`          |
| `recordError`                                    | `logErr`                |
| `getErrors`                                      | `getErrors`             |
| `clearErrors`                                    | `clearErrors`           |
| `getErrorStats`                                  | `errStats`              |
| `validateItinerary`                              | `chkPlan`               |
| `generateFallbackItinerary`                      | `backupTrip`            |
| `generateErrorReport`                            | `errReport`             |
| `getUserFavorites`                               | `listFavs`              |
| `getUserFavoritesWithIoT`                        | `favsWithData`          |
| `addFavorite`                                    | `addFav`                |
| `removeFavorite`                                 | `delFav`                |
| `isFavorite`                                     | `isFaved`               |
| `getFavoriteCount`                               | `favCount`              |
| `saveHotels`                                     | `storeHotels`           |
| `calculateDistance` (hotelCacheService)          | `calDist`               |
| `hotelRecs`                                      | `loadHotels`            |
| `calculateCenterPoint`                           | `calcCenter`            |
| `getHotelTierByBudget`                           | `budgetTier`            |
| `filterHotelsByTier`                             | `filterByTier`          |
| `mapHotelType`                                   | `mapType`               |
| `sortHotels`                                     | `orderHotels`           |
| `inferCityFromSpots` (hotelRecommender)          | `guessCity`             |
| `imgUpload` (imageService)                       | `uploadPic`             |
| `delImg` (imageService)                          | `dropPic`               |
| `extractCloudinaryIdFromUrl`                     | `extractId`             |
| `setAsPrimary`                                   | `setMain`               |
| `getImageById`                                   | `imgById`               |
| `getSpotImgs`                                    | `loadPics`              |
| `batchgetSpotImgsByIds`                          | `batchImgs`             |
| `isOutdoorAttraction` (iotCheckService)          | `isOutdoor`             |
| `adjustForWeather`                               | `weatherAdjust`         |
| `reassignTimeSlots`                              | `shiftSlots`            |
| `minutesToTime` (iotCheckService)                | `minsToTime`            |
| `editTrip`                                       | `editTrip`              |
| `parseLocation` (itineraryAdjustService)         | `parseLoc`              |
| `toRadians` (itineraryAdjustService)             | `toRad`                 |
| `findLocWithCache`                               | `searchLoc`             |
| `getPopularLocations`                            | `hotLocs`               |
| `clearAllCache`                                  | `flushCache`            |
| `cleanExpiredCache`                              | `cleanOld`              |
| `extractMustVisitSpots`                          | `extractMustVisitSpots` |
| `identifyPotentialSpotNames`                     | `findSpots`             |
| `calculateSimilarity`                            | `calcSim`               |
| `getSpotSelect`                                  | `getSpotSelect`         |
| `notify`                                         | `notify`                |
| `notifyBatch`                                    | `notifyBatch`           |
| `getNotificationTitle`                           | `notifTitle`            |
| `getUserNotifications`                           | `fetchNotifs`           |
| `markAsRead`                                     | `readNotif`             |
| `markAllAsRead`                                  | `readAll`               |
| `packList`                                       | `getPack`               |
| `initPack`                                       | `setupPack`             |
| `addItem`                                        | `packAdd`               |
| `batchSave`                                      | `savePackBatch`         |
| `updItem`                                        | `updItem`               |
| `delItem`                                        | `delItem`               |
| `getCategoryName` (packingService)               | `catName`               |
| `getAllCategories`                               | `listCats`              |
| `packProgress`                                   | `packStats`             |
| `saveRestaurants`                                | `storeRes`              |
| `calculateDistance` (restaurantCacheService)     | `calcDist`              |
| `restaurantRecs`                                 | `ResRec`                |
| `getCenterIndex`                                 | `centerIdx`             |
| `extractCuisineType`                             | `foodType`              |
| `filterInappropriateRestaurants`                 | `filterBad`             |
| `calculateDistanceFromLocation`                  | `calcDist`              |
| `sortRestaurants`                                | `orderDining`           |
| `inferCityFromSpots` (restaurantRecommender)     | `guessCity`             |
| `optimizeRoute`                                  | `optRoute`              |
| `greedyOptimization`                             | `greedyOpt`             |
| `twoOptOptimization`                             | `twoOpt`                |
| `swapEdges`                                      | `flipEdges`             |
| `parseLocation` (routeOptimizer)                 | `parseLoc`              |
| `calculateDistance` (routeOptimizer)             | `calcDist`              |
| `toRadians` (routeOptimizer)                     | `toRad`                 |
| `stripCoords`                                    | `stripCoord`            |
| `calculateTotalDistance`                         | `totalDist`             |
| `calculateTotalDistanceWithCoords`               | `sumDistCoord`          |
| `getSpotEnergyCost`                              | `spotCost`              |
| `calculateRouteScore`                            | `scoreRoute`            |
| `calculateEnergyDistributionScore`               | `distScore`             |
| `recalculateTimeSlots`                           | `reslot`                |
| `minutesToTime` (routeOptimizer)                 | `toTime`                |
| `scoreSpots` (scoringEngine)                     | `rankSpots`             |
| `inferSpotCategories`                            | `inferCats`             |
| `calculateIoTScore`                              | `iotScore`              |
| `start`                                          | `start`                 |
| `stop`                                           | `stop`                  |
| `triggerManualSensing`                           | `fireSense`             |
| `generateShareLink`                              | `shareLink`             |
| `getPublicTrip`                                  | `publicTrip`            |
| `cloneTrip`                                      | `forkTrip`              |
| `citySpotsWithIoTData`                           | `cityIoT`               |
| `formatSpotsForAI`                               | `fmtForAI`              |
| `getSpotByName`                                  | `getSoptByName`         |
| `getSpotsByIds`                                  | `getSpotsByIds`         |
| `hotSpots`                                       | `hotSpots`              |
| `findSpotIdByNameAndCity`                        | `spotId`                |
| `generateIoTDataForSpot`                         | `genIot`                |
| `getBatchIoTData`                                | `batchIot`              |
| `generateDynamicIoTData`                         | `liveIoT`               |
| `getBaseCrowdByType`                             | `crowdBase`             |
| `getTimeFactor`                                  | `timeFac`               |
| `getSeasonFactor`                                | `seasonFac`             |
| `getBaseTemperature`                             | `baseTemp`              |
| `getBaseRainProbability`                         | `baseRain`              |
| `checkIsOpen`                                    | `isOpen`                |
| `recommendItinerary`                             | `suggestPlan`           |
| `generateAlternativePools`                       | `altPool`               |
| `scoreSpots` (traditionalRecommender)            | `rateSpots`             |
| `getUserProfile`                                 | `loadProfile`           |
| `updateUserProfile`                              | `savePrefs`             |
| `inferPreferencesFromHistory`                    | `inferPrefs`            |
| `getWeatherData`                                 | `weather`               |
| `getBatchWeatherData`                            | `batchWeather`          |
