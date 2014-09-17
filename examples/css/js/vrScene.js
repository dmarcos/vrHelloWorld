(function (){

  var VRScene = window.VRScene = function (el, callback) {
    var self = this;
    this.el = el;
    // Cache client size to prevent reflows
    this.clientWidth = document.body.clientWidth;
    this.clientHeight = document.body.clientHeight;
    this.requestVRHardware(onVRHardwareReady);
    function onVRHardwareReady(hmd, sensor) {
      if (hmd && sensor) {
        self.update();
      }
    }
    window.addEventListener("keypress", this.onkey.bind(this), true);
    window.addEventListener("mousemove", this.onmousemove.bind(this));
  };

  VRScene.prototype.onkey = function(event) {
    switch (String.fromCharCode(event.charCode)) {
    case 'f':
      this.el.mozRequestFullScreen({ vrDisplay: this.vrHMD });
      break;
    case 'z':
      this.headTracker.zeroSensor();
      break;
    case 'm': // toggle mouse look
      this.mouseLook = !this.mouseLook;
      break;
    }
  };

  VRScene.prototype.onmousemove = function(e) {
    if (this.mouseLook) {
      this.mouseDegY =  (e.clientX/this.clientWidth) * 360 * 2;
      this.mouseDegX = (e.clientY/this.clientHeight)* 360 * 2;
    }
  };

  VRScene.prototype.requestVRHardware = function(callback) {
    var self = this;
    this.vrHardwareReady = false;
    if (navigator.getVRDevices) {
      navigator.getVRDevices().then(gotVRDevices);
    }
    function gotVRDevices(vrDevices) {
      self.iterateVRDevices(vrDevices);
      self.vrHardwareReady = true;
      if (callback) {
        callback(self.vrHMD, self.headTracker);
      }
    }
  };

  VRScene.prototype.iterateVRDevices = function(vrDevices) {
    var i;
    var vrDevice;
    for (i=0; i < vrDevices.length; ++i) {
      vrDevice = vrDevices[i];
      if (vrDevice instanceof HMDVRDevice) {
        this.vrHMD = vrDevice;
        break;
      }
    }
    if (!this.vrHMD) { return; }

    // Then, find that HMD's position sensor
    for (i=0; i < vrDevices.length; ++i) {
      vrDevice = vrDevices[i];
      if (vrDevice instanceof PositionSensorVRDevice &&
          vrDevice.hardwareUnitId == this.vrHMD.hardwareUnitId) {
        this.headTracker = vrDevice;
        break;
      }
    }

    if (!this.headTracker) {
      alert("Found a HMD, but didn't find its orientation sensor?");
    }
  };

  VRScene.prototype.update = function(vrDevices) {
    var headTracker = this.headTracker;
    var mouseLook = this.mouseLook;
    var state = headTracker.getState();
    var cameras = this.el.querySelectorAll('.camera');
    // The camera's position, as a css transform string.
    // For right now, we want it just in the middle.
    var cssCameraPositionTransform = "translate3d(0, 0, 0)";
    var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);
    var i;
    var transform;
    if (mouseLook) {
      transform = 'translate3d(0, 0, 0) rotateX('+this.mouseDegX+'deg) rotateY('+this.mouseDegY+'deg) rotateZ(180deg)';
    } else {
      transform = cssOrientationMatrix + " " + cssCameraPositionTransform;
    }
    for (i = 0; i < cameras.length; i++) {
      cameras[i].style.transform = transform;
    }
    window.requestAnimationFrame(this.update.bind(this));
  };

})();