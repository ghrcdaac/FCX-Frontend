define(["./when-54c2dc71","./Check-6c0211bc","./Math-fc8cecf5","./Cartesian2-a8ce88a9","./Transforms-7e5c2db7","./RuntimeError-2109023a","./WebGLConstants-76bb35d1","./ComponentDatatype-6d99a1ee","./GeometryAttribute-bc86b131","./GeometryAttributes-4fcfcf40","./AttributeCompression-88d6db09","./GeometryPipeline-68412652","./EncodedCartesian3-e3c09f89","./IndexDatatype-53503fee","./IntersectionTests-482ba9a0","./Plane-128f4e7f","./GeometryOffsetAttribute-7350d9af","./VertexFormat-7572c785","./GeometryInstance-e33af374","./EllipsoidRhumbLine-a69f63ad","./PolygonPipeline-77d13e25","./RectangleGeometryLibrary-1b23b855"],function(mt,t,pt,dt,k,e,a,gt,yt,r,n,ft,i,ht,o,s,bt,vt,_t,l,At,H){"use strict";var xt=new dt.Cartesian3,wt=new dt.Cartesian3,Ct=new dt.Cartesian3,Rt=new dt.Cartesian3,_=new dt.Rectangle,z=new dt.Cartesian2,A=new k.BoundingSphere,x=new k.BoundingSphere;function Et(t,e){var a=new yt.Geometry({attributes:new r.GeometryAttributes,primitiveType:yt.PrimitiveType.TRIANGLES});return a.attributes.position=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:e.positions}),t.normal&&(a.attributes.normal=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:e.normals})),t.tangent&&(a.attributes.tangent=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:e.tangents})),t.bitangent&&(a.attributes.bitangent=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:e.bitangents})),a}var Ft=new dt.Cartesian3,Gt=new dt.Cartesian3;function Pt(t,e){var a=t._vertexFormat,r=t._ellipsoid,n=e.height,i=e.width,o=e.northCap,s=e.southCap,l=0,u=n,c=n,m=0;o&&(--c,m+=l=1),s&&(--u,--c,m+=1),m+=i*c;for(var p=a.position?new Float64Array(3*m):void 0,d=a.st?new Float32Array(2*m):void 0,g=0,y=0,f=xt,h=z,b=Number.MAX_VALUE,v=Number.MAX_VALUE,_=-Number.MAX_VALUE,A=-Number.MAX_VALUE,x=l;x<u;++x)for(var w=0;w<i;++w)H.RectangleGeometryLibrary.computePosition(e,r,a.st,x,w,f,h),p[g++]=f.x,p[g++]=f.y,p[g++]=f.z,a.st&&(d[y++]=h.x,d[y++]=h.y,b=Math.min(b,h.x),v=Math.min(v,h.y),_=Math.max(_,h.x),A=Math.max(A,h.y));if(o&&(H.RectangleGeometryLibrary.computePosition(e,r,a.st,0,0,f,h),p[g++]=f.x,p[g++]=f.y,p[g++]=f.z,a.st&&(d[y++]=h.x,d[y++]=h.y,b=h.x,v=h.y,_=h.x,A=h.y)),s&&(H.RectangleGeometryLibrary.computePosition(e,r,a.st,n-1,0,f,h),p[g++]=f.x,p[g++]=f.y,p[g]=f.z,a.st&&(d[y++]=h.x,d[y]=h.y,b=Math.min(b,h.x),v=Math.min(v,h.y),_=Math.max(_,h.x),A=Math.max(A,h.y))),a.st&&(b<0||v<0||1<_||1<A))for(var C=0;C<d.length;C+=2)d[C]=(d[C]-b)/(_-b),d[C+1]=(d[C+1]-v)/(A-v);var R=function(t,e,a,r){var n=t.length,i=e.normal?new Float32Array(n):void 0,o=e.tangent?new Float32Array(n):void 0,s=e.bitangent?new Float32Array(n):void 0,l=0,u=Rt,c=Ct,m=wt;if(e.normal||e.tangent||e.bitangent)for(var p=0;p<n;p+=3){var d=dt.Cartesian3.fromArray(t,p,xt),g=l+1,y=l+2,m=a.geodeticSurfaceNormal(d,m);(e.tangent||e.bitangent)&&(dt.Cartesian3.cross(dt.Cartesian3.UNIT_Z,m,c),k.Matrix3.multiplyByVector(r,c,c),dt.Cartesian3.normalize(c,c),e.bitangent&&dt.Cartesian3.normalize(dt.Cartesian3.cross(m,c,u),u)),e.normal&&(i[l]=m.x,i[g]=m.y,i[y]=m.z),e.tangent&&(o[l]=c.x,o[g]=c.y,o[y]=c.z),e.bitangent&&(s[l]=u.x,s[g]=u.y,s[y]=u.z),l+=3}return Et(e,{positions:t,normals:i,tangents:o,bitangents:s})}(p,a,r,e.tangentRotationMatrix),E=6*(i-1)*(c-1);o&&(E+=3*(i-1)),s&&(E+=3*(i-1));for(var F=ht.IndexDatatype.createTypedArray(m,E),G=0,P=0,V=0;V<c-1;++V){for(var L=0;L<i-1;++L){var D=G+i,M=D+1,T=G+1;F[P++]=G,F[P++]=D,F[P++]=T,F[P++]=T,F[P++]=D,F[P++]=M,++G}++G}if(o||s){var O,N,S=m-1,I=m-1;if(o&&s&&(S=m-2),G=0,o)for(V=0;V<i-1;V++)N=(O=G)+1,F[P++]=S,F[P++]=O,F[P++]=N,++G;if(s)for(G=(c-1)*i,V=0;V<i-1;V++)N=(O=G)+1,F[P++]=O,F[P++]=I,F[P++]=N,++G}return R.indices=F,a.st&&(R.attributes.st=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:d})),R}function Vt(t,e,a,r,n){return t[e++]=r[a],t[e++]=r[a+1],t[e++]=r[a+2],t[e++]=n[a],t[e++]=n[a+1],t[e]=n[a+2],t}function Lt(t,e,a,r){return t[e++]=r[a],t[e++]=r[a+1],t[e++]=r[a],t[e]=r[a+1],t}var Dt=new vt.VertexFormat;function w(t,e){var a,r=t._shadowVolume,n=t._offsetAttribute,i=t._vertexFormat,o=t._extrudedHeight,s=t._surfaceHeight,l=t._ellipsoid,u=e.height,c=e.width;r&&((a=vt.VertexFormat.clone(i,Dt)).normal=!0,t._vertexFormat=a);var m=Pt(t,e);r&&(t._vertexFormat=i);var p=At.PolygonPipeline.scaleToGeodeticHeight(m.attributes.position.values,s,l,!1),d=2*(st=(p=new Float64Array(p)).length),g=new Float64Array(d);g.set(p);var y=At.PolygonPipeline.scaleToGeodeticHeight(m.attributes.position.values,o,l);g.set(y,st),m.attributes.position.values=g;var f,h,b,v=i.normal?new Float32Array(d):void 0,_=i.tangent?new Float32Array(d):void 0,A=i.bitangent?new Float32Array(d):void 0,x=i.st?new Float32Array(d/3*2):void 0;if(i.normal){for(h=m.attributes.normal.values,v.set(h),C=0;C<st;C++)h[C]=-h[C];v.set(h,st),m.attributes.normal.values=v}if(r){h=m.attributes.normal.values,i.normal||(m.attributes.normal=void 0);for(var w=new Float32Array(d),C=0;C<st;C++)h[C]=-h[C];w.set(h,st),m.attributes.extrudeDirection=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:w})}var R,E,F,G=mt.defined(n);if(G&&(R=st/3*2,E=new Uint8Array(R),E=n===bt.GeometryOffsetAttribute.TOP?bt.arrayFill(E,1,0,R/2):(b=n===bt.GeometryOffsetAttribute.NONE?0:1,bt.arrayFill(E,b)),m.attributes.applyOffset=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:1,values:E})),i.tangent){var P=m.attributes.tangent.values;for(_.set(P),C=0;C<st;C++)P[C]=-P[C];_.set(P,st),m.attributes.tangent.values=_}i.bitangent&&(F=m.attributes.bitangent.values,A.set(F),A.set(F,st),m.attributes.bitangent.values=A),i.st&&(f=m.attributes.st.values,x.set(f),x.set(f,st/3*2),m.attributes.st.values=x);var V=m.indices,L=V.length,D=st/3,M=ht.IndexDatatype.createTypedArray(d/3,2*L);for(M.set(V),C=0;C<L;C+=3)M[C+L]=V[C+2]+D,M[C+1+L]=V[C+1]+D,M[C+2+L]=V[C]+D;m.indices=M;var T=e.northCap,O=e.southCap,N=u,S=2,I=0,k=4,H=4;T&&(--S,--N,I+=1,k-=2,--H),O&&(--S,--N,I+=1,k-=2,--H);var z=2*((I+=S*c+2*N-k)+H),B=new Float64Array(3*z),U=r?new Float32Array(3*z):void 0,Y=G?new Uint8Array(z):void 0,q=i.st?new Float32Array(2*z):void 0,X=n===bt.GeometryOffsetAttribute.TOP;G&&!X&&(b=n===bt.GeometryOffsetAttribute.ALL?1:0,Y=bt.arrayFill(Y,b));var Q=0,W=0,J=0,j=0,Z=c*N;for(C=0;C<Z;C+=c)B=Vt(B,Q,$=3*C,p,y),Q+=6,i.st&&(q=Lt(q,W,2*C,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1);if(O){var K=T?1+Z:Z,$=3*K;for(C=0;C<2;C++)B=Vt(B,Q,$,p,y),Q+=6,i.st&&(q=Lt(q,W,2*K,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1)}else for(C=Z-c;C<Z;C++)B=Vt(B,Q,$=3*C,p,y),Q+=6,i.st&&(q=Lt(q,W,2*C,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1);for(C=Z-1;0<C;C-=c)B=Vt(B,Q,$=3*C,p,y),Q+=6,i.st&&(q=Lt(q,W,2*C,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1);if(T){var tt=Z;for($=3*tt,C=0;C<2;C++)B=Vt(B,Q,$,p,y),Q+=6,i.st&&(q=Lt(q,W,2*tt,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1)}else for(C=c-1;0<=C;C--)B=Vt(B,Q,$=3*C,p,y),Q+=6,i.st&&(q=Lt(q,W,2*C,f),W+=4),r&&(J+=3,U[J++]=h[$],U[J++]=h[$+1],U[J++]=h[$+2]),X&&(Y[j++]=1,j+=1);var et=function(t,e,a){var r=t.length,n=e.normal?new Float32Array(r):void 0,i=e.tangent?new Float32Array(r):void 0,o=e.bitangent?new Float32Array(r):void 0,s=0,l=0,u=0,c=!0,m=Rt,p=Ct,d=wt;if(e.normal||e.tangent||e.bitangent)for(var g=0;g<r;g+=6){var y,f=dt.Cartesian3.fromArray(t,g,xt),h=dt.Cartesian3.fromArray(t,(g+6)%r,Ft);c&&(y=dt.Cartesian3.fromArray(t,(g+3)%r,Gt),dt.Cartesian3.subtract(h,f,h),dt.Cartesian3.subtract(y,f,y),d=dt.Cartesian3.normalize(dt.Cartesian3.cross(y,h,d),d),c=!1),dt.Cartesian3.equalsEpsilon(h,f,pt.CesiumMath.EPSILON10)&&(c=!0),(e.tangent||e.bitangent)&&(m=a.geodeticSurfaceNormal(f,m),e.tangent&&(p=dt.Cartesian3.normalize(dt.Cartesian3.cross(m,d,p),p))),e.normal&&(n[s++]=d.x,n[s++]=d.y,n[s++]=d.z,n[s++]=d.x,n[s++]=d.y,n[s++]=d.z),e.tangent&&(i[l++]=p.x,i[l++]=p.y,i[l++]=p.z,i[l++]=p.x,i[l++]=p.y,i[l++]=p.z),e.bitangent&&(o[u++]=m.x,o[u++]=m.y,o[u++]=m.z,o[u++]=m.x,o[u++]=m.y,o[u++]=m.z)}return Et(e,{positions:t,normals:n,tangents:i,bitangents:o})}(B,i,l);i.st&&(et.attributes.st=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:q})),r&&(et.attributes.extrudeDirection=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:U})),G&&(et.attributes.applyOffset=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:1,values:Y}));var at,rt,nt,it,ot=ht.IndexDatatype.createTypedArray(z,6*I),st=B.length/3,lt=0;for(C=0;C<st-1;C+=2){it=((at=C)+2)%st;var ut=dt.Cartesian3.fromArray(B,3*at,Ft),ct=dt.Cartesian3.fromArray(B,3*it,Gt);dt.Cartesian3.equalsEpsilon(ut,ct,pt.CesiumMath.EPSILON10)||(nt=(2+(rt=(at+1)%st))%st,ot[lt++]=at,ot[lt++]=rt,ot[lt++]=it,ot[lt++]=it,ot[lt++]=rt,ot[lt++]=nt)}return et.indices=ot,(et=ft.GeometryPipeline.combineInstances([new _t.GeometryInstance({geometry:m}),new _t.GeometryInstance({geometry:et})]))[0]}var u=[new dt.Cartesian3,new dt.Cartesian3,new dt.Cartesian3,new dt.Cartesian3],C=new dt.Cartographic,R=new dt.Cartographic;function y(t,e,a,r,n){if(0===a)return dt.Rectangle.clone(t,n);var i=H.RectangleGeometryLibrary.computeOptions(t,e,a,0,_,C),o=i.height,s=i.width,l=u;return H.RectangleGeometryLibrary.computePosition(i,r,!1,0,0,l[0]),H.RectangleGeometryLibrary.computePosition(i,r,!1,0,s-1,l[1]),H.RectangleGeometryLibrary.computePosition(i,r,!1,o-1,0,l[2]),H.RectangleGeometryLibrary.computePosition(i,r,!1,o-1,s-1,l[3]),dt.Rectangle.fromCartesianArray(l,r,n)}function d(t){var e=(t=mt.defaultValue(t,mt.defaultValue.EMPTY_OBJECT)).rectangle,a=mt.defaultValue(t.height,0),r=mt.defaultValue(t.extrudedHeight,a);this._rectangle=dt.Rectangle.clone(e),this._granularity=mt.defaultValue(t.granularity,pt.CesiumMath.RADIANS_PER_DEGREE),this._ellipsoid=dt.Ellipsoid.clone(mt.defaultValue(t.ellipsoid,dt.Ellipsoid.WGS84)),this._surfaceHeight=Math.max(a,r),this._rotation=mt.defaultValue(t.rotation,0),this._stRotation=mt.defaultValue(t.stRotation,0),this._vertexFormat=vt.VertexFormat.clone(mt.defaultValue(t.vertexFormat,vt.VertexFormat.DEFAULT)),this._extrudedHeight=Math.min(a,r),this._shadowVolume=mt.defaultValue(t.shadowVolume,!1),this._workerName="createRectangleGeometry",this._offsetAttribute=t.offsetAttribute,this._rotatedRectangle=void 0,this._textureCoordinateRotationPoints=void 0}d.packedLength=dt.Rectangle.packedLength+dt.Ellipsoid.packedLength+vt.VertexFormat.packedLength+7,d.pack=function(t,e,a){return a=mt.defaultValue(a,0),dt.Rectangle.pack(t._rectangle,e,a),a+=dt.Rectangle.packedLength,dt.Ellipsoid.pack(t._ellipsoid,e,a),a+=dt.Ellipsoid.packedLength,vt.VertexFormat.pack(t._vertexFormat,e,a),a+=vt.VertexFormat.packedLength,e[a++]=t._granularity,e[a++]=t._surfaceHeight,e[a++]=t._rotation,e[a++]=t._stRotation,e[a++]=t._extrudedHeight,e[a++]=t._shadowVolume?1:0,e[a]=mt.defaultValue(t._offsetAttribute,-1),e};var g=new dt.Rectangle,f=dt.Ellipsoid.clone(dt.Ellipsoid.UNIT_SPHERE),h={rectangle:g,ellipsoid:f,vertexFormat:Dt,granularity:void 0,height:void 0,rotation:void 0,stRotation:void 0,extrudedHeight:void 0,shadowVolume:void 0,offsetAttribute:void 0};d.unpack=function(t,e,a){e=mt.defaultValue(e,0);var r=dt.Rectangle.unpack(t,e,g);e+=dt.Rectangle.packedLength;var n=dt.Ellipsoid.unpack(t,e,f);e+=dt.Ellipsoid.packedLength;var i=vt.VertexFormat.unpack(t,e,Dt);e+=vt.VertexFormat.packedLength;var o=t[e++],s=t[e++],l=t[e++],u=t[e++],c=t[e++],m=1===t[e++],p=t[e];return mt.defined(a)?(a._rectangle=dt.Rectangle.clone(r,a._rectangle),a._ellipsoid=dt.Ellipsoid.clone(n,a._ellipsoid),a._vertexFormat=vt.VertexFormat.clone(i,a._vertexFormat),a._granularity=o,a._surfaceHeight=s,a._rotation=l,a._stRotation=u,a._extrudedHeight=c,a._shadowVolume=m,a._offsetAttribute=-1===p?void 0:p,a):(h.granularity=o,h.height=s,h.rotation=l,h.stRotation=u,h.extrudedHeight=c,h.shadowVolume=m,h.offsetAttribute=-1===p?void 0:p,new d(h))},d.computeRectangle=function(t,e){var a=(t=mt.defaultValue(t,mt.defaultValue.EMPTY_OBJECT)).rectangle,r=mt.defaultValue(t.granularity,pt.CesiumMath.RADIANS_PER_DEGREE),n=mt.defaultValue(t.ellipsoid,dt.Ellipsoid.WGS84);return y(a,r,mt.defaultValue(t.rotation,0),n,e)};var E=new k.Matrix3,F=new k.Quaternion,G=new dt.Cartographic;d.createGeometry=function(t){if(!pt.CesiumMath.equalsEpsilon(t._rectangle.north,t._rectangle.south,pt.CesiumMath.EPSILON10)&&!pt.CesiumMath.equalsEpsilon(t._rectangle.east,t._rectangle.west,pt.CesiumMath.EPSILON10)){var e,a,r=t._rectangle,n=t._ellipsoid,i=t._rotation,o=t._stRotation,s=t._vertexFormat,l=H.RectangleGeometryLibrary.computeOptions(r,t._granularity,i,o,_,C,R),u=E;0!==o||0!==i?(e=dt.Rectangle.center(r,G),a=n.geodeticSurfaceNormalCartographic(e,Ft),k.Quaternion.fromAxisAngle(a,-o,F),k.Matrix3.fromQuaternion(F,u)):k.Matrix3.clone(k.Matrix3.IDENTITY,u);var c,m,p,d,g,y,f,h=t._surfaceHeight,b=t._extrudedHeight,v=!pt.CesiumMath.equalsEpsilon(h,b,0,pt.CesiumMath.EPSILON2);return l.lonScalar=1/t._rectangle.width,l.latScalar=1/t._rectangle.height,l.tangentRotationMatrix=u,r=t._rectangle,p=v?(f=w(t,l),c=k.BoundingSphere.fromRectangle3D(r,n,h,x),m=k.BoundingSphere.fromRectangle3D(r,n,b,A),k.BoundingSphere.union(c,m)):((f=Pt(t,l)).attributes.position.values=At.PolygonPipeline.scaleToGeodeticHeight(f.attributes.position.values,h,n,!1),mt.defined(t._offsetAttribute)&&(d=f.attributes.position.values.length,g=new Uint8Array(d/3),y=t._offsetAttribute===bt.GeometryOffsetAttribute.NONE?0:1,bt.arrayFill(g,y),f.attributes.applyOffset=new yt.GeometryAttribute({componentDatatype:gt.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:1,values:g})),k.BoundingSphere.fromRectangle3D(r,n,h)),s.position||delete f.attributes.position,new yt.Geometry({attributes:f.attributes,indices:f.indices,primitiveType:f.primitiveType,boundingSphere:p,offsetAttribute:t._offsetAttribute})}},d.createShadowVolume=function(t,e,a){var r=t._granularity,n=t._ellipsoid,i=e(r,n),o=a(r,n);return new d({rectangle:t._rectangle,rotation:t._rotation,ellipsoid:n,stRotation:t._stRotation,granularity:r,extrudedHeight:o,height:i,vertexFormat:vt.VertexFormat.POSITION_ONLY,shadowVolume:!0})};var b=new dt.Rectangle,v=[new dt.Cartesian2,new dt.Cartesian2,new dt.Cartesian2],P=new yt.Matrix2,V=new dt.Cartographic;return Object.defineProperties(d.prototype,{rectangle:{get:function(){return mt.defined(this._rotatedRectangle)||(this._rotatedRectangle=y(this._rectangle,this._granularity,this._rotation,this._ellipsoid)),this._rotatedRectangle}},textureCoordinateRotationPoints:{get:function(){return mt.defined(this._textureCoordinateRotationPoints)||(this._textureCoordinateRotationPoints=function(t){if(0===t._stRotation)return[0,0,0,1,1,0];var e=dt.Rectangle.clone(t._rectangle,b),a=t._granularity,r=t._ellipsoid,n=y(e,a,t._rotation-t._stRotation,r,b),i=v;i[0].x=n.west,i[0].y=n.south,i[1].x=n.west,i[1].y=n.north,i[2].x=n.east,i[2].y=n.south;for(var o=t.rectangle,s=yt.Matrix2.fromRotation(t._stRotation,P),l=dt.Rectangle.center(o,V),u=0;u<3;++u){var c=i[u];c.x-=l.longitude,c.y-=l.latitude,yt.Matrix2.multiplyByVector(s,c,c),c.x+=l.longitude,c.y+=l.latitude,c.x=(c.x-o.west)/o.width,c.y=(c.y-o.south)/o.height}var m=i[0],p=i[1],d=i[2],g=new Array(6);return dt.Cartesian2.pack(m,g),dt.Cartesian2.pack(p,g,2),dt.Cartesian2.pack(d,g,4),g}(this)),this._textureCoordinateRotationPoints}}}),function(t,e){return mt.defined(e)&&(t=d.unpack(t,e)),t._ellipsoid=dt.Ellipsoid.clone(t._ellipsoid),t._rectangle=dt.Rectangle.clone(t._rectangle),d.createGeometry(t)}});
