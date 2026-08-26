export const vertexShader = /* glsl */`
precision highp float;
attribute vec3 position;
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export const fragmentShader = /* glsl */`
precision highp float;

uniform vec2 uResolution;
uniform vec3 uCamera;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform int uStage;
uniform float uTime;

#define PI 3.14159265359
#define MAX_STEPS 176

float hash(vec3 p) {
  p = fract(p * .1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Step 01: a pixel becomes a world-space ray.
vec3 createRay() {
  vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
  float focalLength = 1.0 / tan(radians(34.0) * .5);
  return normalize(focalLength * uForward + p.x * uRight + p.y * uUp);
}

// Schwarzschild metric term in units G = c = r_s = 1.
float metric(float r, float rs) {
  return max(1.0 - rs / max(r, rs + .0001), .0001);
}

// Every geodesic lies in one plane through the origin.
vec3 planePosition(vec2 q, vec3 er0, vec3 et0) {
  return q.x * (er0 * cos(q.y) + et0 * sin(q.y));
}

vec3 planeDirection(vec2 q, float pr, float L, float rs, vec3 er0, vec3 et0) {
  vec3 er = er0 * cos(q.y) + et0 * sin(q.y);
  vec3 et = -er0 * sin(q.y) + et0 * cos(q.y);
  vec2 local = normalize(vec2(sqrt(metric(q.x, rs)) * pr, L / q.x));
  return normalize(er * local.x + et * local.y);
}

// Hamilton equations for y = (r, phi, p_r).
vec3 derivative(vec2 q, float pr, float pt, float L, float rs) {
  float r = max(q.x, rs + .0002);
  float f = metric(r, rs);
  float fp = rs / (r * r);
  return vec3(
    f * pr,
    L / (r * r),
    -.5 * (pt * pt * fp / (f * f) + fp * pr * pr - 2.0 * L * L / (r * r * r))
  );
}

// One fourth-order Runge-Kutta step.
void rk4(inout vec2 q, inout float pr, float pt, float L, float rs, float h) {
  vec3 k1 = derivative(q, pr, pt, L, rs);
  vec3 k2 = derivative(q + .5 * h * k1.xy, pr + .5 * h * k1.z, pt, L, rs);
  vec3 k3 = derivative(q + .5 * h * k2.xy, pr + .5 * h * k2.z, pt, L, rs);
  vec3 k4 = derivative(q + h * k3.xy, pr + h * k3.z, pt, L, rs);
  vec3 change = h * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
  q += change.xy;
  pr += change.z;
}

vec3 sky(vec3 d) {
  vec3 ad = abs(d);
  vec2 face = ad.x > ad.y && ad.x > ad.z ? d.yz / ad.x : (ad.y > ad.z ? d.xz / ad.y : d.xy / ad.z);
  vec2 cells = floor(face * 520.0);
  vec2 point = fract(face * 520.0) - .5;
  float random = hash(vec3(cells, floor(dot(d, vec3(13.0, 17.0, 19.0)))));
  float star = smoothstep(.08, 0.0, length(point)) * step(.988, random);

  vec3 tint = mix(vec3(.55, .7, 1.0), vec3(1.0, .72, .42), random);
  return tint * star * (1.5 + 5.0 * random * random);
}

vec3 heat(float t) {
  vec3 red = vec3(.72, .035, .004);
  vec3 gold = vec3(1.15, .46, .055);
  vec3 white = vec3(1.5, 1.28, 1.02);
  return t < .55 ? mix(red, gold, t / .55) : mix(gold, white, clamp((t - .55) / .55, 0.0, 1.0));
}

// Sparse emissive cells evaluated only at a ray/disk intersection.
vec2 particleLayer(vec2 p, float scale, float layer) {
  vec2 grid = p * scale;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - .5;
  vec2 jitter = vec2(
    hash(vec3(cell, layer)),
    hash(vec3(cell + vec2(17.3, 41.7), layer + 3.1))
  ) - .5;
  float seed = hash(vec3(cell + vec2(7.1, 13.9), layer + 9.7));
  float threshold = layer < 1.5 ? .58 : .73;
  float occupied = step(threshold, seed);
  float size = mix(.055, .14, hash(vec3(cell + vec2(29.1, 5.7), layer + 15.2)));
  if (layer > 1.5) size *= .62;
  float distanceToParticle = length((local - .92 * jitter) * vec2(1.0, 1.18));
  float core = smoothstep(size, size * .16, distanceToParticle);
  float glow = smoothstep(size * 3.2, size * .72, distanceToParticle);
  return occupied * vec2(core, glow);
}

vec4 diskLight(vec3 hit) {
  float r = length(hit.xz);
  float innerFade = smoothstep(3.0, 3.25, r);
  float mask = innerFade;
  float temperature = pow(3.0 / max(r, 3.0), .75);
  float radialEmission = pow(3.0 / max(r, 3.0), .55);

  vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
  float beta = min(sqrt(1.0 / max(2.0 * (r - 1.0), .1)), .58);
  float gamma = inversesqrt(1.0 - beta * beta);
  float mu = dot(tangent, normalize(uCamera - hit));
  float doppler = 1.0 / (gamma * max(1.0 - beta * mu, .25));
  float redshift = sqrt(max(1.0 - 1.0 / r, 0.0));

  // Trace the emitting matter backward along a Kepler-like orbit. Inner
  // particles advance faster than outer ones, while the coordinate grid stays fixed.
  float angularVelocity = 2.4 / pow(max(r, 3.0), 1.5);
  float angle = -uTime * angularVelocity;
  mat2 inverseOrbit = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 movingPoint = inverseOrbit * hit.xz;
  float lodScale = mix(1.0, .42, smoothstep(10.0, 48.0, r));
  vec2 coarse = particleLayer(movingPoint, 3.2 * lodScale, 1.0);
  vec2 fine = particleLayer(movingPoint, 6.4 * lodScale, 2.0);
  float particleCore = pow(max(coarse.x, .68 * fine.x), 1.8);
  float particleGlow = max(coarse.y, .52 * fine.y);
  float unresolvedGlow = smoothstep(12.0, 36.0, r) * radialEmission;
  vec3 spectrum = heat(temperature * redshift) * pow(doppler, 3.0);
  vec3 color = spectrum * radialEmission;
  color *= 3.45 * particleCore + .18 * particleGlow + .045 * unresolvedGlow;
  float opacity = mask * sqrt(radialEmission)
    * (.62 * particleCore + .075 * particleGlow + .018 * unresolvedGlow);
  return vec4(color, opacity);
}

void main() {
  vec3 ray = createRay();
  float rs = uStage == 0 ? 0.0 : 1.0;
  float r0 = length(uCamera);
  vec3 er0 = normalize(uCamera);
  vec3 normal = cross(er0, ray);
  if (length(normal) < .0001) normal = cross(er0, uUp);
  vec3 et0 = normalize(cross(normalize(normal), er0));

  float f0 = metric(r0, rs);
  float pt = -sqrt(f0);
  float pr = dot(ray, er0) / sqrt(f0);
  float L = r0 * dot(ray, et0);
  float impactParameter = abs(L) / max(abs(pt), .0001);
  float criticalImpact = 1.5 * sqrt(3.0);
  vec2 q = vec2(r0, 0.0);

  vec3 color = vec3(0.0);
  float transmission = 1.0;
  float minimumRadius = r0;
  float bending = 0.0;
  bool captured = false;
  vec3 previous = planePosition(q, er0, et0);

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 before = planeDirection(q, pr, L, rs, er0, et0);
    float h = .055 * mix(.8, 3.2, smoothstep(1.4, 10.0, q.x));
    rk4(q, pr, pt, L, rs, h);

    if (rs > 0.0 && q.x <= 1.006) {
      captured = true;
      minimumRadius = q.x;
      break;
    }

    vec3 world = planePosition(q, er0, et0);
    vec3 after = planeDirection(q, pr, L, rs, er0, et0);
    minimumRadius = min(minimumRadius, q.x);
    bending += acos(clamp(dot(before, after), -1.0, 1.0));

    if (uStage == 3 && previous.y * world.y < 0.0) {
      float t = previous.y / (previous.y - world.y);
      vec3 hit = mix(previous, world, clamp(t, 0.0, 1.0));
      float diskRadius = length(hit.xz);
      if (diskRadius > 3.0) {
        vec4 light = diskLight(hit);
        color += transmission * light.rgb * light.a;
        transmission *= 1.0 - light.a;
      }
    }

    previous = world;
    if (q.x > 32.0 && dot(after, world) > 0.0) break;
    if (transmission < .04) break;
  }

  vec3 escapedDirection = planeDirection(q, pr, L, rs, er0, et0);
  if (!captured) {
    color += transmission * sky(escapedDirection);
  }

  // Lesson 04: the shadow is exactly the set of captured pixel directions.
  if (uStage == 1) {
    color = captured ? vec3(0.0) : sky(escapedDirection);
  }

  if (uStage == 2) {
    float photonSphere = exp(-pow((minimumRadius - 1.5) / .08, 2.0));
    float deflection = clamp(bending / PI, 0.0, 1.0);
    float criticalRay = exp(-pow((impactParameter - criticalImpact) / .035, 2.0));
    color = captured ? vec3(.002) : mix(vec3(.025, .085, .19), vec3(.82, .13, .018), deflection);
    color += vec3(.55, .24, .035) * photonSphere;
    color += vec3(1.65, 1.15, .48) * criticalRay;
  }

  if (uStage == 3 && !captured) {
    float criticalRim = exp(-pow((impactParameter - criticalImpact) / .022, 2.0));
    float photonDwell = exp(-pow((minimumRadius - 1.5) / .055, 2.0));
    float rim = max(criticalRim, .5 * photonDwell);
    color += vec3(1.15, .48, .09) * rim * .48;
  }

  color = color / (1.0 + color);
  color = pow(max(color, 0.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(color, 1.0);
}`;
