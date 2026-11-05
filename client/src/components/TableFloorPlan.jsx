import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createFloorPlan, fitCamera } from './floorPlanScene.js'

export default function TableFloorPlan({ tables, selected, locked, onSelect }) {
    const mountRef = useRef(null)
    const tipRef = useRef(null)
    const propsRef = useRef({})
    const [failed, setFailed] = useState(false)

    propsRef.current = {
        tables,
        selected: selected === '' || selected == null ? null : Number(selected),
        locked,
        onSelect,
    }

    const layoutKey = tables.map((t) => `${t.tableNumber}:${t.seats}`).join('|')

    useEffect(() => {
        const mount = mountRef.current
        const tip = tipRef.current
        if (!mount || !layoutKey) return

        let renderer
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        } catch (err) {
            setFailed(true)
            return
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

        const plan = createFloorPlan(propsRef.current.tables)
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()
        let hover = null

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            fitCamera(camera, w / h)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(mount)

        const pick = (e) => {
            const rect = renderer.domElement.getBoundingClientRect()
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
            raycaster.setFromCamera(pointer, camera)
            const hit = raycaster.intersectObjects(plan.hitMeshes, false)[0]
            return hit ? hit.object.userData.tableNumber : null
        }
        const infoFor = (n) => propsRef.current.tables.find((t) => t.tableNumber === n)

        const hideTip = () => {
            tip.style.opacity = '0'
        }
        const onMove = (e) => {
            if (propsRef.current.locked) {
                hover = null
                renderer.domElement.style.cursor = 'default'
                hideTip()
                return
            }
            const n = pick(e)
            const info = n != null ? infoFor(n) : null
            hover = info && info.available ? n : null
            renderer.domElement.style.cursor = hover != null ? 'pointer' : 'default'
            if (info) {
                const rect = mount.getBoundingClientRect()
                tip.textContent = `Table ${info.tableNumber} · ${info.seats} seats${info.available ? '' : ' · Booked'}`
                tip.style.left = `${e.clientX - rect.left}px`
                tip.style.top = `${e.clientY - rect.top}px`
                tip.style.opacity = '1'
            } else {
                hideTip()
            }
        }
        const onLeave = () => {
            hover = null
            hideTip()
        }
        const onClick = (e) => {
            const { locked: isLocked, onSelect: select } = propsRef.current
            if (isLocked) return
            const n = pick(e)
            const info = n != null ? infoFor(n) : null
            if (info && info.available) select(n)
        }
        renderer.domElement.addEventListener('pointermove', onMove)
        renderer.domElement.addEventListener('pointerleave', onLeave)
        renderer.domElement.addEventListener('click', onClick)

        let rafId = 0
        let running = false
        let last = performance.now()
        const t0 = last

        const frame = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            const { tables: list, selected: sel, locked: isLocked } = propsRef.current
            list.forEach((t) => {
                let state = 'available'
                if (isLocked) state = 'locked'
                else if (!t.available) state = 'booked'
                else if (sel === t.tableNumber) state = 'selected'
                else if (hover === t.tableNumber) state = 'hover'
                plan.setState(t.tableNumber, state)
            })
            plan.update(dt, (now - t0) / 1000)
            renderer.render(plan.scene, camera)
            if (running) rafId = requestAnimationFrame(frame)
        }
        const start = () => {
            if (running) return
            running = true
            last = performance.now()
            rafId = requestAnimationFrame(frame)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(rafId)
        }

        const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0 })
        io.observe(mount)
        const onVisibility = () => (document.hidden ? stop() : start())
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            stop()
            io.disconnect()
            ro.disconnect()
            document.removeEventListener('visibilitychange', onVisibility)
            renderer.domElement.removeEventListener('pointermove', onMove)
            renderer.domElement.removeEventListener('pointerleave', onLeave)
            renderer.domElement.removeEventListener('click', onClick)
            plan.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
    }, [layoutKey])

    if (failed) {
        return <div className="tfp tfp-note">3D view is not available on this device. Please pick a table from the list below.</div>
    }

    return (
        <div className="tfp" role="group" aria-label="Restaurant floor plan, pick a table">
            <div className="tfp-canvas" ref={mountRef}></div>
            <div className="tfp-tip" ref={tipRef}></div>

            {!layoutKey && <div className="tfp-lock">Loading floor plan…</div>}
            {layoutKey && locked && <div className="tfp-lock">Select a date and time to see which tables are free</div>}

            <div className="tfp-legend">
                <span><i className="tfp-dot tfp-dot-free"></i>Available</span>
                <span><i className="tfp-dot tfp-dot-sel"></i>Selected</span>
                <span><i className="tfp-dot tfp-dot-booked"></i>Booked</span>
            </div>
        </div>
    )
}