define(["exports","./when-54c2dc71","./Check-6c0211bc","./Math-1124a290","./Cartesian2-36f5627e","./Transforms-441ed215","./ComponentDatatype-a26dd044","./GeometryAttribute-c636bf20","./GeometryAttributes-4fcfcf40","./Plane-2a7715fd","./VertexFormat-4d8b817a"],function(e,M,m,a,D,V,F,O,z,f,d){"use strict";function h(e){this.planes=M.defaultValue(e,[])}var p=[new D.Cartesian3,new D.Cartesian3,new D.Cartesian3];D.Cartesian3.clone(D.Cartesian3.UNIT_X,p[0]),D.Cartesian3.clone(D.Cartesian3.UNIT_Y,p[1]),D.Cartesian3.clone(D.Cartesian3.UNIT_Z,p[2]);var l=new D.Cartesian3,c=new D.Cartesian3,u=new f.Plane(new D.Cartesian3(1,0,0),0);function i(e){e=M.defaultValue(e,M.defaultValue.EMPTY_OBJECT),this.left=e.left,this._left=void 0,this.right=e.right,this._right=void 0,this.top=e.top,this._top=void 0,this.bottom=e.bottom,this._bottom=void 0,this.near=M.defaultValue(e.near,1),this._near=this.near,this.far=M.defaultValue(e.far,5e8),this._far=this.far,this._cullingVolume=new h,this._orthographicMatrix=new V.Matrix4}function s(e){if(!(M.defined(e.right)&&M.defined(e.left)&&M.defined(e.top)&&M.defined(e.bottom)&&M.defined(e.near)&&M.defined(e.far)))throw new m.DeveloperError("right, left, top, bottom, near, or far parameters are not set.");if(e.top!==e._top||e.bottom!==e._bottom||e.left!==e._left||e.right!==e._right||e.near!==e._near||e.far!==e._far){if(e.left>e.right)throw new m.DeveloperError("right must be greater than left.");if(e.bottom>e.top)throw new m.DeveloperError("top must be greater than bottom.");if(e.near<=0||e.near>e.far)throw new m.DeveloperError("near must be greater than zero and less than far.");e._left=e.left,e._right=e.right,e._top=e.top,e._bottom=e.bottom,e._near=e.near,e._far=e.far,e._orthographicMatrix=V.Matrix4.computeOrthographicOffCenter(e.left,e.right,e.bottom,e.top,e.near,e.far,e._orthographicMatrix)}}h.fromBoundingSphere=function(e,t){if(!M.defined(e))throw new m.DeveloperError("boundingSphere is required.");M.defined(t)||(t=new h);var r=p.length,a=t.planes;a.length=2*r;for(var i=e.center,n=e.radius,o=0,s=0;s<r;++s){var f=p[s],u=a[o],d=a[o+1];M.defined(u)||(u=a[o]=new V.Cartesian4),M.defined(d)||(d=a[o+1]=new V.Cartesian4),D.Cartesian3.multiplyByScalar(f,-n,l),D.Cartesian3.add(i,l,l),u.x=f.x,u.y=f.y,u.z=f.z,u.w=-D.Cartesian3.dot(f,l),D.Cartesian3.multiplyByScalar(f,n,l),D.Cartesian3.add(i,l,l),d.x=-f.x,d.y=-f.y,d.z=-f.z,d.w=-D.Cartesian3.dot(D.Cartesian3.negate(f,c),l),o+=2}return t},h.prototype.computeVisibility=function(e){if(!M.defined(e))throw new m.DeveloperError("boundingVolume is required.");for(var t=this.planes,r=!1,a=0,i=t.length;a<i;++a){var n=e.intersectPlane(f.Plane.fromCartesian4(t[a],u));if(n===V.Intersect.OUTSIDE)return V.Intersect.OUTSIDE;n===V.Intersect.INTERSECTING&&(r=!0)}return r?V.Intersect.INTERSECTING:V.Intersect.INSIDE},h.prototype.computeVisibilityWithPlaneMask=function(e,t){if(!M.defined(e))throw new m.DeveloperError("boundingVolume is required.");if(!M.defined(t))throw new m.DeveloperError("parentPlaneMask is required.");if(t===h.MASK_OUTSIDE||t===h.MASK_INSIDE)return t;for(var r=h.MASK_INSIDE,a=this.planes,i=0,n=a.length;i<n;++i){var o=i<31?1<<i:0;if(!(i<31&&0==(t&o))){var s=e.intersectPlane(f.Plane.fromCartesian4(a[i],u));if(s===V.Intersect.OUTSIDE)return h.MASK_OUTSIDE;s===V.Intersect.INTERSECTING&&(r|=o)}}return r},h.MASK_OUTSIDE=4294967295,h.MASK_INSIDE=0,h.MASK_INDETERMINATE=2147483647,Object.defineProperties(i.prototype,{projectionMatrix:{get:function(){return s(this),this._orthographicMatrix}}});var C=new D.Cartesian3,w=new D.Cartesian3,_=new D.Cartesian3,v=new D.Cartesian3;function y(e){e=M.defaultValue(e,M.defaultValue.EMPTY_OBJECT),this._offCenterFrustum=new i,this.width=e.width,this._width=void 0,this.aspectRatio=e.aspectRatio,this._aspectRatio=void 0,this.near=M.defaultValue(e.near,1),this._near=this.near,this.far=M.defaultValue(e.far,5e8),this._far=this.far}function n(e){if(!(M.defined(e.width)&&M.defined(e.aspectRatio)&&M.defined(e.near)&&M.defined(e.far)))throw new m.DeveloperError("width, aspectRatio, near, or far parameters are not set.");var t=e._offCenterFrustum;if(e.width!==e._width||e.aspectRatio!==e._aspectRatio||e.near!==e._near||e.far!==e._far){if(e.aspectRatio<0)throw new m.DeveloperError("aspectRatio must be positive.");if(e.near<0||e.near>e.far)throw new m.DeveloperError("near must be greater than zero and less than far.");e._aspectRatio=e.aspectRatio,e._width=e.width,e._near=e.near,e._far=e.far;var r=1/e.aspectRatio;t.right=.5*e.width,t.left=-t.right,t.top=r*t.right,t.bottom=-t.top,t.near=e.near,t.far=e.far}}function o(e){e=M.defaultValue(e,M.defaultValue.EMPTY_OBJECT),this.left=e.left,this._left=void 0,this.right=e.right,this._right=void 0,this.top=e.top,this._top=void 0,this.bottom=e.bottom,this._bottom=void 0,this.near=M.defaultValue(e.near,1),this._near=this.near,this.far=M.defaultValue(e.far,5e8),this._far=this.far,this._cullingVolume=new h,this._perspectiveMatrix=new V.Matrix4,this._infinitePerspective=new V.Matrix4}function g(e){if(!(M.defined(e.right)&&M.defined(e.left)&&M.defined(e.top)&&M.defined(e.bottom)&&M.defined(e.near)&&M.defined(e.far)))throw new m.DeveloperError("right, left, top, bottom, near, or far parameters are not set.");var t=e.top,r=e.bottom,a=e.right,i=e.left,n=e.near,o=e.far;if(t!==e._top||r!==e._bottom||i!==e._left||a!==e._right||n!==e._near||o!==e._far){if(e.near<=0||e.near>e.far)throw new m.DeveloperError("near must be greater than zero and less than far.");e._left=i,e._right=a,e._top=t,e._bottom=r,e._near=n,e._far=o,e._perspectiveMatrix=V.Matrix4.computePerspectiveOffCenter(i,a,r,t,n,o,e._perspectiveMatrix),e._infinitePerspective=V.Matrix4.computeInfinitePerspectiveOffCenter(i,a,r,t,n,e._infinitePerspective)}}i.prototype.computeCullingVolume=function(e,t,r){if(!M.defined(e))throw new m.DeveloperError("position is required.");if(!M.defined(t))throw new m.DeveloperError("direction is required.");if(!M.defined(r))throw new m.DeveloperError("up is required.");var a=this._cullingVolume.planes,i=this.top,n=this.bottom,o=this.right,s=this.left,f=this.near,u=this.far,d=D.Cartesian3.cross(t,r,C);D.Cartesian3.normalize(d,d);var h=w;D.Cartesian3.multiplyByScalar(t,f,h),D.Cartesian3.add(e,h,h);var p=_;D.Cartesian3.multiplyByScalar(d,s,p),D.Cartesian3.add(h,p,p);var l=a[0];return M.defined(l)||(l=a[0]=new V.Cartesian4),l.x=d.x,l.y=d.y,l.z=d.z,l.w=-D.Cartesian3.dot(d,p),D.Cartesian3.multiplyByScalar(d,o,p),D.Cartesian3.add(h,p,p),l=a[1],M.defined(l)||(l=a[1]=new V.Cartesian4),l.x=-d.x,l.y=-d.y,l.z=-d.z,l.w=-D.Cartesian3.dot(D.Cartesian3.negate(d,v),p),D.Cartesian3.multiplyByScalar(r,n,p),D.Cartesian3.add(h,p,p),l=a[2],M.defined(l)||(l=a[2]=new V.Cartesian4),l.x=r.x,l.y=r.y,l.z=r.z,l.w=-D.Cartesian3.dot(r,p),D.Cartesian3.multiplyByScalar(r,i,p),D.Cartesian3.add(h,p,p),l=a[3],M.defined(l)||(l=a[3]=new V.Cartesian4),l.x=-r.x,l.y=-r.y,l.z=-r.z,l.w=-D.Cartesian3.dot(D.Cartesian3.negate(r,v),p),l=a[4],M.defined(l)||(l=a[4]=new V.Cartesian4),l.x=t.x,l.y=t.y,l.z=t.z,l.w=-D.Cartesian3.dot(t,h),D.Cartesian3.multiplyByScalar(t,u,p),D.Cartesian3.add(e,p,p),l=a[5],M.defined(l)||(l=a[5]=new V.Cartesian4),l.x=-t.x,l.y=-t.y,l.z=-t.z,l.w=-D.Cartesian3.dot(D.Cartesian3.negate(t,v),p),this._cullingVolume},i.prototype.getPixelDimensions=function(e,t,r,a,i){if(s(this),!M.defined(e)||!M.defined(t))throw new m.DeveloperError("Both drawingBufferWidth and drawingBufferHeight are required.");if(e<=0)throw new m.DeveloperError("drawingBufferWidth must be greater than zero.");if(t<=0)throw new m.DeveloperError("drawingBufferHeight must be greater than zero.");if(!M.defined(r))throw new m.DeveloperError("distance is required.");if(!M.defined(a))throw new m.DeveloperError("pixelRatio is required.");if(a<=0)throw new m.DeveloperError("pixelRatio must be greater than zero.");if(!M.defined(i))throw new m.DeveloperError("A result object is required.");var n=a*(this.right-this.left)/e,o=a*(this.top-this.bottom)/t;return i.x=n,i.y=o,i},i.prototype.clone=function(e){return M.defined(e)||(e=new i),e.left=this.left,e.right=this.right,e.top=this.top,e.bottom=this.bottom,e.near=this.near,e.far=this.far,e._left=void 0,e._right=void 0,e._top=void 0,e._bottom=void 0,e._near=void 0,e._far=void 0,e},i.prototype.equals=function(e){return M.defined(e)&&e instanceof i&&this.right===e.right&&this.left===e.left&&this.top===e.top&&this.bottom===e.bottom&&this.near===e.near&&this.far===e.far},i.prototype.equalsEpsilon=function(e,t,r){return e===this||M.defined(e)&&e instanceof i&&a.CesiumMath.equalsEpsilon(this.right,e.right,t,r)&&a.CesiumMath.equalsEpsilon(this.left,e.left,t,r)&&a.CesiumMath.equalsEpsilon(this.top,e.top,t,r)&&a.CesiumMath.equalsEpsilon(this.bottom,e.bottom,t,r)&&a.CesiumMath.equalsEpsilon(this.near,e.near,t,r)&&a.CesiumMath.equalsEpsilon(this.far,e.far,t,r)},y.packedLength=4,y.pack=function(e,t,r){return m.Check.typeOf.object("value",e),m.Check.defined("array",t),r=M.defaultValue(r,0),t[r++]=e.width,t[r++]=e.aspectRatio,t[r++]=e.near,t[r]=e.far,t},y.unpack=function(e,t,r){return m.Check.defined("array",e),t=M.defaultValue(t,0),M.defined(r)||(r=new y),r.width=e[t++],r.aspectRatio=e[t++],r.near=e[t++],r.far=e[t],r},Object.defineProperties(y.prototype,{projectionMatrix:{get:function(){return n(this),this._offCenterFrustum.projectionMatrix}}}),y.prototype.computeCullingVolume=function(e,t,r){return n(this),this._offCenterFrustum.computeCullingVolume(e,t,r)},y.prototype.getPixelDimensions=function(e,t,r,a,i){return n(this),this._offCenterFrustum.getPixelDimensions(e,t,r,a,i)},y.prototype.clone=function(e){return M.defined(e)||(e=new y),e.aspectRatio=this.aspectRatio,e.width=this.width,e.near=this.near,e.far=this.far,e._aspectRatio=void 0,e._width=void 0,e._near=void 0,e._far=void 0,this._offCenterFrustum.clone(e._offCenterFrustum),e},y.prototype.equals=function(e){return!!(M.defined(e)&&e instanceof y)&&(n(this),n(e),this.width===e.width&&this.aspectRatio===e.aspectRatio&&this._offCenterFrustum.equals(e._offCenterFrustum))},y.prototype.equalsEpsilon=function(e,t,r){return!!(M.defined(e)&&e instanceof y)&&(n(this),n(e),a.CesiumMath.equalsEpsilon(this.width,e.width,t,r)&&a.CesiumMath.equalsEpsilon(this.aspectRatio,e.aspectRatio,t,r)&&this._offCenterFrustum.equalsEpsilon(e._offCenterFrustum,t,r))},Object.defineProperties(o.prototype,{projectionMatrix:{get:function(){return g(this),this._perspectiveMatrix}},infiniteProjectionMatrix:{get:function(){return g(this),this._infinitePerspective}}});var x=new D.Cartesian3,b=new D.Cartesian3,E=new D.Cartesian3,R=new D.Cartesian3;function k(e){e=M.defaultValue(e,M.defaultValue.EMPTY_OBJECT),this._offCenterFrustum=new o,this.fov=e.fov,this._fov=void 0,this._fovy=void 0,this._sseDenominator=void 0,this.aspectRatio=e.aspectRatio,this._aspectRatio=void 0,this.near=M.defaultValue(e.near,1),this._near=this.near,this.far=M.defaultValue(e.far,5e8),this._far=this.far,this.xOffset=M.defaultValue(e.xOffset,0),this._xOffset=this.xOffset,this.yOffset=M.defaultValue(e.yOffset,0),this._yOffset=this.yOffset}function P(e){if(!(M.defined(e.fov)&&M.defined(e.aspectRatio)&&M.defined(e.near)&&M.defined(e.far)))throw new m.DeveloperError("fov, aspectRatio, near, or far parameters are not set.");var t=e._offCenterFrustum;if(e.fov!==e._fov||e.aspectRatio!==e._aspectRatio||e.near!==e._near||e.far!==e._far||e.xOffset!==e._xOffset||e.yOffset!==e._yOffset){if(e.fov<0||e.fov>=Math.PI)throw new m.DeveloperError("fov must be in the range [0, PI).");if(e.aspectRatio<0)throw new m.DeveloperError("aspectRatio must be positive.");if(e.near<0||e.near>e.far)throw new m.DeveloperError("near must be greater than zero and less than far.");e._aspectRatio=e.aspectRatio,e._fov=e.fov,e._fovy=e.aspectRatio<=1?e.fov:2*Math.atan(Math.tan(.5*e.fov)/e.aspectRatio),e._near=e.near,e._far=e.far,e._sseDenominator=2*Math.tan(.5*e._fovy),e._xOffset=e.xOffset,e._yOffset=e.yOffset,t.top=e.near*Math.tan(.5*e._fovy),t.bottom=-t.top,t.right=e.aspectRatio*t.top,t.left=-t.right,t.near=e.near,t.far=e.far,t.right+=e.xOffset,t.left+=e.xOffset,t.top+=e.yOffset,t.bottom+=e.yOffset}}o.prototype.computeCullingVolume=function(e,t,r){if(!M.defined(e))throw new m.DeveloperError("position is required.");if(!M.defined(t))throw new m.DeveloperError("direction is required.");if(!M.defined(r))throw new m.DeveloperError("up is required.");var a=this._cullingVolume.planes,i=this.top,n=this.bottom,o=this.right,s=this.left,f=this.near,u=this.far,d=D.Cartesian3.cross(t,r,x),h=b;D.Cartesian3.multiplyByScalar(t,f,h),D.Cartesian3.add(e,h,h);var p=E;D.Cartesian3.multiplyByScalar(t,u,p),D.Cartesian3.add(e,p,p);var l=R;D.Cartesian3.multiplyByScalar(d,s,l),D.Cartesian3.add(h,l,l),D.Cartesian3.subtract(l,e,l),D.Cartesian3.normalize(l,l),D.Cartesian3.cross(l,r,l),D.Cartesian3.normalize(l,l);var c=a[0];return M.defined(c)||(c=a[0]=new V.Cartesian4),c.x=l.x,c.y=l.y,c.z=l.z,c.w=-D.Cartesian3.dot(l,e),D.Cartesian3.multiplyByScalar(d,o,l),D.Cartesian3.add(h,l,l),D.Cartesian3.subtract(l,e,l),D.Cartesian3.cross(r,l,l),D.Cartesian3.normalize(l,l),c=a[1],M.defined(c)||(c=a[1]=new V.Cartesian4),c.x=l.x,c.y=l.y,c.z=l.z,c.w=-D.Cartesian3.dot(l,e),D.Cartesian3.multiplyByScalar(r,n,l),D.Cartesian3.add(h,l,l),D.Cartesian3.subtract(l,e,l),D.Cartesian3.cross(d,l,l),D.Cartesian3.normalize(l,l),c=a[2],M.defined(c)||(c=a[2]=new V.Cartesian4),c.x=l.x,c.y=l.y,c.z=l.z,c.w=-D.Cartesian3.dot(l,e),D.Cartesian3.multiplyByScalar(r,i,l),D.Cartesian3.add(h,l,l),D.Cartesian3.subtract(l,e,l),D.Cartesian3.cross(l,d,l),D.Cartesian3.normalize(l,l),c=a[3],M.defined(c)||(c=a[3]=new V.Cartesian4),c.x=l.x,c.y=l.y,c.z=l.z,c.w=-D.Cartesian3.dot(l,e),c=a[4],M.defined(c)||(c=a[4]=new V.Cartesian4),c.x=t.x,c.y=t.y,c.z=t.z,c.w=-D.Cartesian3.dot(t,h),D.Cartesian3.negate(t,l),c=a[5],M.defined(c)||(c=a[5]=new V.Cartesian4),c.x=l.x,c.y=l.y,c.z=l.z,c.w=-D.Cartesian3.dot(l,p),this._cullingVolume},o.prototype.getPixelDimensions=function(e,t,r,a,i){if(g(this),!M.defined(e)||!M.defined(t))throw new m.DeveloperError("Both drawingBufferWidth and drawingBufferHeight are required.");if(e<=0)throw new m.DeveloperError("drawingBufferWidth must be greater than zero.");if(t<=0)throw new m.DeveloperError("drawingBufferHeight must be greater than zero.");if(!M.defined(r))throw new m.DeveloperError("distance is required.");if(!M.defined(a))throw new m.DeveloperError("pixelRatio is required");if(a<=0)throw new m.DeveloperError("pixelRatio must be greater than zero.");if(!M.defined(i))throw new m.DeveloperError("A result object is required.");var n=1/this.near,o=2*a*r*(this.top*n)/t,s=2*a*r*(this.right*n)/e;return i.x=s,i.y=o,i},o.prototype.clone=function(e){return M.defined(e)||(e=new o),e.right=this.right,e.left=this.left,e.top=this.top,e.bottom=this.bottom,e.near=this.near,e.far=this.far,e._left=void 0,e._right=void 0,e._top=void 0,e._bottom=void 0,e._near=void 0,e._far=void 0,e},o.prototype.equals=function(e){return M.defined(e)&&e instanceof o&&this.right===e.right&&this.left===e.left&&this.top===e.top&&this.bottom===e.bottom&&this.near===e.near&&this.far===e.far},o.prototype.equalsEpsilon=function(e,t,r){return e===this||M.defined(e)&&e instanceof o&&a.CesiumMath.equalsEpsilon(this.right,e.right,t,r)&&a.CesiumMath.equalsEpsilon(this.left,e.left,t,r)&&a.CesiumMath.equalsEpsilon(this.top,e.top,t,r)&&a.CesiumMath.equalsEpsilon(this.bottom,e.bottom,t,r)&&a.CesiumMath.equalsEpsilon(this.near,e.near,t,r)&&a.CesiumMath.equalsEpsilon(this.far,e.far,t,r)},k.packedLength=6,k.pack=function(e,t,r){return m.Check.typeOf.object("value",e),m.Check.defined("array",t),r=M.defaultValue(r,0),t[r++]=e.fov,t[r++]=e.aspectRatio,t[r++]=e.near,t[r++]=e.far,t[r++]=e.xOffset,t[r]=e.yOffset,t},k.unpack=function(e,t,r){return m.Check.defined("array",e),t=M.defaultValue(t,0),M.defined(r)||(r=new k),r.fov=e[t++],r.aspectRatio=e[t++],r.near=e[t++],r.far=e[t++],r.xOffset=e[t++],r.yOffset=e[t],r},Object.defineProperties(k.prototype,{projectionMatrix:{get:function(){return P(this),this._offCenterFrustum.projectionMatrix}},infiniteProjectionMatrix:{get:function(){return P(this),this._offCenterFrustum.infiniteProjectionMatrix}},fovy:{get:function(){return P(this),this._fovy}},sseDenominator:{get:function(){return P(this),this._sseDenominator}}}),k.prototype.computeCullingVolume=function(e,t,r){return P(this),this._offCenterFrustum.computeCullingVolume(e,t,r)},k.prototype.getPixelDimensions=function(e,t,r,a,i){return P(this),this._offCenterFrustum.getPixelDimensions(e,t,r,a,i)},k.prototype.clone=function(e){return M.defined(e)||(e=new k),e.aspectRatio=this.aspectRatio,e.fov=this.fov,e.near=this.near,e.far=this.far,e._aspectRatio=void 0,e._fov=void 0,e._near=void 0,e._far=void 0,this._offCenterFrustum.clone(e._offCenterFrustum),e},k.prototype.equals=function(e){return!!(M.defined(e)&&e instanceof k)&&(P(this),P(e),this.fov===e.fov&&this.aspectRatio===e.aspectRatio&&this._offCenterFrustum.equals(e._offCenterFrustum))},k.prototype.equalsEpsilon=function(e,t,r){return!!(M.defined(e)&&e instanceof k)&&(P(this),P(e),a.CesiumMath.equalsEpsilon(this.fov,e.fov,t,r)&&a.CesiumMath.equalsEpsilon(this.aspectRatio,e.aspectRatio,t,r)&&this._offCenterFrustum.equalsEpsilon(e._offCenterFrustum,t,r))};function q(e){m.Check.typeOf.object("options",e),m.Check.typeOf.object("options.frustum",e.frustum),m.Check.typeOf.object("options.origin",e.origin),m.Check.typeOf.object("options.orientation",e.orientation);var t,r,a=e.frustum,i=e.orientation,n=e.origin,o=M.defaultValue(e.vertexFormat,d.VertexFormat.DEFAULT),s=M.defaultValue(e._drawNearPlane,!0);a instanceof k?(t=0,r=k.packedLength):a instanceof y&&(t=1,r=y.packedLength),this._frustumType=t,this._frustum=a.clone(),this._origin=D.Cartesian3.clone(n),this._orientation=V.Quaternion.clone(i),this._drawNearPlane=s,this._vertexFormat=o,this._workerName="createFrustumGeometry",this.packedLength=2+r+D.Cartesian3.packedLength+V.Quaternion.packedLength+d.VertexFormat.packedLength}q.pack=function(e,t,r){m.Check.typeOf.object("value",e),m.Check.defined("array",t),r=M.defaultValue(r,0);var a=e._frustumType,i=e._frustum;return 0===(t[r++]=a)?(k.pack(i,t,r),r+=k.packedLength):(y.pack(i,t,r),r+=y.packedLength),D.Cartesian3.pack(e._origin,t,r),r+=D.Cartesian3.packedLength,V.Quaternion.pack(e._orientation,t,r),r+=V.Quaternion.packedLength,d.VertexFormat.pack(e._vertexFormat,t,r),t[r+=d.VertexFormat.packedLength]=e._drawNearPlane?1:0,t};var S=new k,T=new y,A=new V.Quaternion,I=new D.Cartesian3,B=new d.VertexFormat;function L(e,t,r,a,i,n,o,s){for(var f=e/3*2,u=0;u<4;++u)M.defined(t)&&(t[e]=n.x,t[e+1]=n.y,t[e+2]=n.z),M.defined(r)&&(r[e]=o.x,r[e+1]=o.y,r[e+2]=o.z),M.defined(a)&&(a[e]=s.x,a[e+1]=s.y,a[e+2]=s.z),e+=3;i[f]=0,i[1+f]=0,i[2+f]=1,i[3+f]=0,i[4+f]=1,i[5+f]=1,i[6+f]=0,i[7+f]=1}q.unpack=function(e,t,r){m.Check.defined("array",e),t=M.defaultValue(t,0);var a,i=e[t++];0===i?(a=k.unpack(e,t,S),t+=k.packedLength):(a=y.unpack(e,t,T),t+=y.packedLength);var n=D.Cartesian3.unpack(e,t,I);t+=D.Cartesian3.packedLength;var o=V.Quaternion.unpack(e,t,A);t+=V.Quaternion.packedLength;var s=d.VertexFormat.unpack(e,t,B),f=1===e[t+=d.VertexFormat.packedLength];if(!M.defined(r))return new q({frustum:a,origin:n,orientation:o,vertexFormat:s,_drawNearPlane:f});var u=i===r._frustumType?r._frustum:void 0;return r._frustum=a.clone(u),r._frustumType=i,r._origin=D.Cartesian3.clone(n,r._origin),r._orientation=V.Quaternion.clone(o,r._orientation),r._vertexFormat=d.VertexFormat.clone(s,r._vertexFormat),r._drawNearPlane=f,r};var N=new V.Matrix3,j=new V.Matrix4,G=new V.Matrix4,U=new D.Cartesian3,Q=new D.Cartesian3,K=new D.Cartesian3,W=new D.Cartesian3,Y=new D.Cartesian3,H=new D.Cartesian3,J=new Array(3),X=new Array(4);X[0]=new V.Cartesian4(-1,-1,1,1),X[1]=new V.Cartesian4(1,-1,1,1),X[2]=new V.Cartesian4(1,1,1,1),X[3]=new V.Cartesian4(-1,1,1,1);for(var Z=new Array(4),t=0;t<4;++t)Z[t]=new V.Cartesian4;q._computeNearFarPlanes=function(e,t,r,a,i,n,o,s){var f=V.Matrix3.fromQuaternion(t,N),u=M.defaultValue(n,U),d=M.defaultValue(o,Q),h=M.defaultValue(s,K),u=V.Matrix3.getColumn(f,0,u),d=V.Matrix3.getColumn(f,1,d),h=V.Matrix3.getColumn(f,2,h);D.Cartesian3.normalize(u,u),D.Cartesian3.normalize(d,d),D.Cartesian3.normalize(h,h),D.Cartesian3.negate(u,u);var p,l,c,m,C=V.Matrix4.computeView(e,h,d,u,j);0===r?(l=a.projectionMatrix,c=V.Matrix4.multiply(l,C,G),m=V.Matrix4.inverse(c,G)):p=V.Matrix4.inverseTransformation(C,G),M.defined(m)?(J[0]=a.near,J[1]=a.far):(J[0]=0,J[1]=a.near,J[2]=a.far);for(var w=0;w<2;++w)for(var _=0;_<4;++_){var v,y,g,x,b=V.Cartesian4.clone(X[_],Z[_]);M.defined(m)?(v=1/(b=V.Matrix4.multiplyByVector(m,b,b)).w,D.Cartesian3.multiplyByScalar(b,v,b),D.Cartesian3.subtract(b,e,b),D.Cartesian3.normalize(b,b),y=D.Cartesian3.dot(h,b),D.Cartesian3.multiplyByScalar(b,J[w]/y,b),D.Cartesian3.add(b,e,b)):(M.defined(a._offCenterFrustum)&&(a=a._offCenterFrustum),g=J[w],x=J[w+1],b.x=.5*(b.x*(a.right-a.left)+a.left+a.right),b.y=.5*(b.y*(a.top-a.bottom)+a.bottom+a.top),b.z=.5*(b.z*(g-x)-g-x),b.w=1,V.Matrix4.multiplyByVector(p,b,b)),i[12*w+3*_]=b.x,i[12*w+3*_+1]=b.y,i[12*w+3*_+2]=b.z}},q.createGeometry=function(e){var t=e._frustumType,r=e._frustum,a=e._origin,i=e._orientation,n=e._drawNearPlane,o=e._vertexFormat,s=n?6:5,f=new Float64Array(72);q._computeNearFarPlanes(a,i,t,r,f);var u=24;f[u]=f[12],f[u+1]=f[13],f[u+2]=f[14],f[u+3]=f[0],f[u+4]=f[1],f[u+5]=f[2],f[u+6]=f[9],f[u+7]=f[10],f[u+8]=f[11],f[u+9]=f[21],f[u+10]=f[22],f[u+11]=f[23],f[u+=12]=f[15],f[u+1]=f[16],f[u+2]=f[17],f[u+3]=f[3],f[u+4]=f[4],f[u+5]=f[5],f[u+6]=f[0],f[u+7]=f[1],f[u+8]=f[2],f[u+9]=f[12],f[u+10]=f[13],f[u+11]=f[14],f[u+=12]=f[3],f[u+1]=f[4],f[u+2]=f[5],f[u+3]=f[15],f[u+4]=f[16],f[u+5]=f[17],f[u+6]=f[18],f[u+7]=f[19],f[u+8]=f[20],f[u+9]=f[6],f[u+10]=f[7],f[u+11]=f[8],f[u+=12]=f[6],f[u+1]=f[7],f[u+2]=f[8],f[u+3]=f[18],f[u+4]=f[19],f[u+5]=f[20],f[u+6]=f[21],f[u+7]=f[22],f[u+8]=f[23],f[u+9]=f[9],f[u+10]=f[10],f[u+11]=f[11],n||(f=f.subarray(12));var d,h,p,l,c,m,C,w,_,v,y=new z.GeometryAttributes({position:new O.GeometryAttribute({componentDatatype:F.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:f})});(M.defined(o.normal)||M.defined(o.tangent)||M.defined(o.bitangent)||M.defined(o.st))&&(d=M.defined(o.normal)?new Float32Array(12*s):void 0,h=M.defined(o.tangent)?new Float32Array(12*s):void 0,p=M.defined(o.bitangent)?new Float32Array(12*s):void 0,l=M.defined(o.st)?new Float32Array(8*s):void 0,c=U,m=Q,C=K,w=D.Cartesian3.negate(c,W),_=D.Cartesian3.negate(m,Y),v=D.Cartesian3.negate(C,H),u=0,n&&(L(u,d,h,p,l,v,c,m),u+=12),L(u,d,h,p,l,C,w,m),L(u+=12,d,h,p,l,w,v,m),L(u+=12,d,h,p,l,_,v,w),L(u+=12,d,h,p,l,c,C,m),L(u+=12,d,h,p,l,m,C,w),M.defined(d)&&(y.normal=new O.GeometryAttribute({componentDatatype:F.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:d})),M.defined(h)&&(y.tangent=new O.GeometryAttribute({componentDatatype:F.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:h})),M.defined(p)&&(y.bitangent=new O.GeometryAttribute({componentDatatype:F.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:p})),M.defined(l)&&(y.st=new O.GeometryAttribute({componentDatatype:F.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:l})));for(var g=new Uint16Array(6*s),x=0;x<s;++x){var b=6*x,E=4*x;g[b]=E,g[1+b]=1+E,g[2+b]=2+E,g[3+b]=E,g[4+b]=2+E,g[5+b]=3+E}return new O.Geometry({attributes:y,indices:g,primitiveType:O.PrimitiveType.TRIANGLES,boundingSphere:V.BoundingSphere.fromVertices(f)})},e.FrustumGeometry=q,e.OrthographicFrustum=y,e.PerspectiveFrustum=k});
//# sourceMappingURL=FrustumGeometry-46bf56ff.js.map
