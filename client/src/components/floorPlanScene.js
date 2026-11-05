import * as THREE from 'three'

const FLOOR_W = 10.8
const FLOOR_D = 8.2

const LAYOUT = {
    1: { x: -3.4, z: -1.9 },
    3: { x: -0.6, z: -1.9 },
    5: { x: 3.0, z: -1.9 },
    2: { x: -3.4, z: 1.9 },
    4: { x: -0.6, z: 1.9 },
    6: { x: 3.0, z: 1.9 },
}

const STYLES = {
    available: { top: 0xc9a22f, emissive: 0x241a00, chair: 0x6b5a1c, label: 0x14100a },
    hover: { top: 0xf0cd5a, emissive: 0x4a3800, chair: 0x9a8228, label: 0x14100a },
    selected: { top: 0xffe08a, emissive: 0x6a4c00, chair: 0xd4af37, label: 0x14100a },
    booked: { top: 0x34343f, emissive: 0x000000, chair: 0x262630, label: 0x7a7a88 },
    locked: { top: 0x4a4a58, emissive: 0x000000, chair: 0x32323e, label: 0x9a9aa8 },
}

const tableRadius = (seats) => 0.35 + seats * 0.1

const positionFor = (tableNumber, index) => {
    if (LAYOUT[tableNumber]) return LAYOUT[tableNumber]
    const col = index % 3
    const row = Math.floor(index / 3)
    return { x: -3.4 + col * 3.2, z: -1.9 + (row % 2) * 3.8 }
}

function textureFromCanvas(canvas) {
    const w = canvas.width
    const h = canvas.height
    const src = canvas.getContext('2d').getImageData(0, 0, w, h).data
    const data = new Uint8Array(w * h * 4)
    for (let y = 0; y < h; y++) {
        data.set(src.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4) // rows ulta (WebGL ke liye)
    }
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
    return tex
}

function makeTextTexture(text, w, h, fontPx) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${fontPx}px Inter, Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + fontPx * 0.05)
    return textureFromCanvas(canvas)
}

function makeShadowTexture() {
    const s = 64
    const data = new Uint8Array(s * s * 4)
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const dx = ((x + 0.5) / s) * 2 - 1
            const dy = ((y + 0.5) / s) * 2 - 1
            let a = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy))
            a = a * a * (3 - 2 * a) * 0.65
            const i = (y * s + x) * 4
            data[i + 3] = Math.round(a * 255)
        }
    }
    const tex = new THREE.DataTexture(data, s, s, THREE.RGBAFormat)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
    return tex
}

export function fitCamera(camera, aspect) {
    camera.aspect = aspect
    camera.fov = 36
    camera.updateProjectionMatrix()

    const dir = new THREE.Vector3(0, 0.86, 0.5).normalize()
    const target = new THREE.Vector3(0, 0, 0.1)
    const corners = [
        [-FLOOR_W / 2, 0, -FLOOR_D / 2], [FLOOR_W / 2, 0, -FLOOR_D / 2],
        [-FLOOR_W / 2, 0, FLOOR_D / 2], [FLOOR_W / 2, 0, FLOOR_D / 2],
        [-FLOOR_W / 2, 0.8, -FLOOR_D / 2], [FLOOR_W / 2, 0.8, -FLOOR_D / 2],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z))

    let lo = 5
    let hi = 60
    for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2
        camera.position.copy(dir).multiplyScalar(mid).add(target)
        camera.lookAt(target)
        camera.updateMatrixWorld()
        const fits = corners.every((c) => {
            const p = c.clone().project(camera)
            return Math.abs(p.x) <= 0.95 && Math.abs(p.y) <= 0.93
        })
        if (fits) hi = mid
        else lo = mid
    }
    camera.position.copy(dir).multiplyScalar(hi).add(target)
    camera.lookAt(target)
    camera.updateMatrixWorld()
}

export function createFloorPlan(tables) {
    const scene = new THREE.Scene()

    scene.add(new THREE.AmbientLight(0xffffff, 1.0))
    const key = new THREE.DirectionalLight(0xfff0d0, 1.9)
    key.position.set(-5, 10, 6)
    scene.add(key)
    const warm = new THREE.PointLight(0xffb85a, 18, 20)
    warm.position.set(0, 4.5, 0)
    scene.add(warm)

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(FLOOR_W, FLOOR_D),
        new THREE.MeshStandardMaterial({ color: 0x15151e, roughness: 0.95 })
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.8 })
    const addWall = (w, d, x, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), wallMat)
        m.position.set(x, 0.14, z)
        scene.add(m)
    }
    const T = 0.14
    addWall(FLOOR_W + T, T, 0, -FLOOR_D / 2)
    addWall(T, FLOOR_D, -FLOOR_W / 2, 0)
    addWall(T, FLOOR_D, FLOOR_W / 2, 0)
    const gap = 1.8
    const sideW = (FLOOR_W - gap) / 2
    addWall(sideW, T, -(gap / 2 + sideW / 2), FLOOR_D / 2)
    addWall(sideW, T, gap / 2 + sideW / 2, FLOOR_D / 2)

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(gap, 0.05, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xd4af37 })
    )
    door.position.set(0, 0.03, FLOOR_D / 2)
    scene.add(door)
    const entranceLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.4),
        new THREE.MeshBasicMaterial({ map: makeTextTexture('ENTRANCE', 256, 64, 30), transparent: true, color: 0x9a9aa8, depthWrite: false })
    )
    entranceLabel.rotation.x = -Math.PI / 2
    entranceLabel.position.set(0, 0.02, FLOOR_D / 2 - 0.45)
    scene.add(entranceLabel)

    const shadowTex = makeShadowTexture()
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    const shadowGeo = new THREE.PlaneGeometry(1, 1)
    const topGeoCache = new Map()
    const seatGeo = new THREE.BoxGeometry(0.32, 0.2, 0.32)
    const backGeo = new THREE.BoxGeometry(0.07, 0.34, 0.32)
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x20202c, roughness: 0.7 })

    const hitMeshes = []
    const entries = new Map()

    tables.forEach((t, index) => {
        const { x, z } = positionFor(t.tableNumber, index)
        const r = tableRadius(t.seats)

        const group = new THREE.Group()
        group.position.set(x, 0, z)

        const topMat = new THREE.MeshStandardMaterial({ color: STYLES.available.top, roughness: 0.5, metalness: 0.1 })
        const chairMat = new THREE.MeshStandardMaterial({ color: STYLES.available.chair, roughness: 0.7 })
        const labelMat = new THREE.MeshBasicMaterial({
            map: makeTextTexture(String(t.tableNumber), 128, 128, 80),
            transparent: true,
            depthWrite: false,
            color: STYLES.available.label,
        })

        const key2 = r.toFixed(2)
        if (!topGeoCache.has(key2)) topGeoCache.set(key2, new THREE.CylinderGeometry(r, r, 0.1, 40))
        const top = new THREE.Mesh(topGeoCache.get(key2), topMat)
        top.position.y = 0.55
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.26, 0.5, 16), pedestalMat)
        pedestal.position.y = 0.25
        const label = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.15, r * 1.15), labelMat)
        label.rotation.x = -Math.PI / 2
        label.position.y = 0.61
        group.add(pedestal, top, label)

        for (let i = 0; i < t.seats; i++) {
            const theta = (i / t.seats) * Math.PI * 2 + Math.PI / t.seats
            const chair = new THREE.Group()
            const seat = new THREE.Mesh(seatGeo, chairMat)
            seat.position.y = 0.3
            const back = new THREE.Mesh(backGeo, chairMat)
            back.position.set(0.17, 0.5, 0)
            chair.add(seat, back)
            const R = r + 0.38
            chair.position.set(Math.cos(theta) * R, 0, Math.sin(theta) * R)
            chair.rotation.y = -theta
            group.add(chair)
        }

        const hit = new THREE.Mesh(
            new THREE.CylinderGeometry(r + 0.75, r + 0.75, 0.9, 20),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        )
        hit.position.y = 0.45
        hit.userData.tableNumber = t.tableNumber
        group.add(hit)
        hitMeshes.push(hit)

        const shadow = new THREE.Mesh(shadowGeo, shadowMat)
        shadow.rotation.x = -Math.PI / 2
        shadow.scale.setScalar((r + 0.9) * 2.3)
        shadow.position.set(x, 0.012, z)
        scene.add(shadow)

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(r + 0.82, r + 0.9, 64),
            new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.7, depthWrite: false })
        )
        ring.rotation.x = -Math.PI / 2
        ring.position.set(x, 0.02, z)
        ring.visible = false
        scene.add(ring)

        scene.add(group)
        entries.set(t.tableNumber, { group, topMat, chairMat, labelMat, ring, state: 'available' })
    })

    const setState = (tableNumber, state) => {
        const e = entries.get(tableNumber)
        if (!e || e.state === state) return
        e.state = state
        const s = STYLES[state]
        e.topMat.color.setHex(s.top)
        e.topMat.emissive.setHex(s.emissive)
        e.chairMat.color.setHex(s.chair)
        e.labelMat.color.setHex(s.label)
        e.ring.visible = state === 'selected'
    }

    const update = (dt, time) => {
        entries.forEach((e) => {
            const target = e.state === 'hover' ? 0.16 : e.state === 'selected' ? 0.08 : 0
            e.group.position.y += (target - e.group.position.y) * Math.min(1, dt * 12)
            if (e.ring.visible) {
                e.ring.material.opacity = 0.55 + 0.25 * Math.sin(time * 3)
                e.ring.scale.setScalar(1 + 0.025 * Math.sin(time * 3))
            }
        })
    }

    const dispose = () => {
        scene.traverse((o) => {
            if (o.geometry) o.geometry.dispose()
            if (o.material) {
                const mats = Array.isArray(o.material) ? o.material : [o.material]
                mats.forEach((m) => {
                    if (m.map) m.map.dispose()
                    m.dispose()
                })
            }
        })
    }

    return { scene, hitMeshes, setState, update, dispose }
}