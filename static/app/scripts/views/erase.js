/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'views/base',
  'stache!templates/erase',
  'lib/modal_manager',
  'views/erase_confirmation'
], function (BaseView, EraseTemplate, ModalManager, EraseConfirmationView) {
  'use strict';

  var EraseView = BaseView.extend({
    template: EraseTemplate,

    events: {
      'click button.erase': 'confirmErase'
    },

    initialize: function (options) {
      this.device = options.device;
    },

    confirmErase: function (event) {
      ModalManager.push(new EraseConfirmationView({ device: this.device }));
    }
  });

  return EraseView;
});
