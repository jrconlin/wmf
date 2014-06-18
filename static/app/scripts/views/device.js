/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'backbone',
  'jquery',
  'views/base',
  'stache!templates/device',
  'models/device',
  'models/track_command',
  'lib/modal_manager',
  'views/device_selector',
  'views/play_sound',
  'views/lost_mode',
  'views/erase'
], function (Backbone, $, BaseView, DeviceTemplate, Device, TrackCommand, ModalManager, DeviceSelectorView, PlaySoundView, LostModeView, EraseView) {
  'use strict';

  var DeviceView = BaseView.extend({
    template: DeviceTemplate,

    events: {
      'click a.menu': 'openDeviceSelector',
      'click span.play-sound': 'openPlaySound',
      'click span.lost-mode': 'openLostMode',
      'click span.erase': 'openErase'
    },

    initialize: function () {
      // Listen for model changes
      this.listenTo(this.model, 'change:latitude', this.updateMapPosition);
      this.listenTo(this.model, 'change:activity', this.updateMarkerIcon);
      this.listenTo(this.model, 'change:located', this.updateMarkerIcon);

      this.startTracking();
    },

    openDeviceSelector: function (event) {
      event.stopPropagation();

      ModalManager.open(new DeviceSelectorView({ currentDevice: this.model }));
    },

    openPlaySound: function (event) {
      event.stopPropagation();

      ModalManager.open(new PlaySoundView({ device: this.model }), $(event.target).closest('span.button'));
    },

    openLostMode: function (event) {
      event.stopPropagation();

      ModalManager.open(new LostModeView({ device: this.model }), $(event.target).closest('span.button'));
    },

    openErase: function (event) {
      event.stopPropagation();

      ModalManager.open(new EraseView({ device: this.model }), $(event.target).closest('span.button'));
    },

    beforeDestroy: function () {
      this.model.stopListening();
    },

    startTracking: function () {
      this.model.listenForUpdates();

      this.model.sendCommand(new TrackCommand({ duration: 60, period: 10 }));
    },

    updateMapPosition: function () {
      var latitude = this.model.get('latitude');
      var longitude = this.model.get('longitude');

      // Setup the map if it doesn't exist
      if (!this.map) {
        // Create the map
        this.map = L.mapbox.map('map', 'mozilla-webprod.ihm4m8h8', { zoomControl: false });

        // Position zoom controls
        new L.Control.Zoom({ position: 'topright' }).addTo(this.map);

        // Create marker
        this.marker = L.marker([latitude, longitude], {
          icon: L.mapbox.marker.icon({
            type: 'Feature',
            geometry: {
              type: 'Point',
              // These are purposely reversed in this context
              coordinates: [longitude, latitude]
            },
            properties: {}
          })
        });

        // Set marker icon
        this.updateMarkerIcon();

        // Add marker to the map
        this.marker.addTo(this.map);

        // Set view to new latitude and longitude and zoom to 15
        this.map.setView([latitude, longitude], 15);
      } else {
        this.marker.setLatLng([latitude, longitude]);
        this.map.panTo([latitude, longitude]);
      }
    },

    updateMarkerIcon: function (animate) {
      if (this.marker) {
        var iconURL = '/images/pin-' + this.model.get('activity');
        var className = 'pin';

        if (this.model.get('located')) {
          iconURL += '-located';
          className += ' pin-located';
        } else {
          className += ' pin-locating';
        }

        iconURL += '.png';

        this.marker.setIcon(L.icon({
          iconUrl: iconURL,
          iconSize: [118, 169], // size of the icon
          iconAnchor: [59, 166], // point of the icon which will correspond to marker's location
          className: className
        }));

        var $pin = this.$('.pin');

        // Position locating spinner
        if (this.model.get('located')) {
          this.$('.pin-locating-spinner').remove();
        } else {
          var $spinner = this.$('.pin-locating-spinner');

          if ($spinner.length === 0) {
            $spinner = $('<div class="pin-locating-spinner"></div>');

            $pin.after($spinner);
          }

          // Copy pin's transform and fade in
          $spinner.css('transform', $pin.css('transform')).hide().fadeIn();
        }
      }
    }
  });

  return DeviceView;
});
