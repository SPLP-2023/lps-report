// Comprehensive failure definitions by standard with references and minimum requirements
const standardFailures = {
    "BS EN 62305": [
        { 
            failure: "Earth resistance exceeds 10ohms overall requirement", 
            ref: "BS EN 62305-3, Section 5.4.2",
            req: "The earth termination overall resistance should be reduced below 10ohms"
        },
        { 
            failure: "Poor continuity between air terminals and down conductors", 
            ref: "BS EN 62305-3, Section 5.2.1",
            req: "All connections should be cleaned, tightened, and tested to ensure continuity below 0.2ohms"
        },
        { 
            failure: "Conductor fixings are inadequate with Table E.1", 
            ref: "BS EN 62305-3, Section 5.5.2 & Table E.1",
            req: "Air-terminations and down conductors shall be firmly fixed so that the electrodynamic or accidental mechanical forces will not cause conductors to break or loosen."
        },
        { 
            failure: "Air terminals not meeting LPL requirements", 
            ref: "BS EN 62305-3, Section 5.2.2, Table 2",
            req: "Air terminals must be replaced or supplemented to meet the specified Lightning Protection Level"
        },
        { 
            failure: "Down conductors not following shortest route to earth", 
            ref: "BS EN 62305-3, Section 5.3.1",
            req: "Down conductors must be re-routed to follow the most direct path to earth termination"
        },
        { 
            failure: "Inadequate separation distance from metalwork/plant", 
            ref: "BS EN 62305-3, Section 6.3",
            req: "Increase separation distance or install equipotential bonding as per calculated requirements"
        },
        { 
            failure: "Missing equipotential bonding connections", 
            ref: "BS EN 62305-3, Section 6.2",
            req: "Install equipotential bonding conductors to all metallic services and structural elements or install air finial rods if separation can be achieved"
        },
        { 
            failure: "Non-compliant conductor materials or dimensions", 
            ref: "BS EN 62305-3, Section 5.5, Table 3",
            req: "Replace conductors with compliant materials meeting minimum cross-sectional area requirements"
        },
        { 
            failure: "Earth termination system Type A/B non-compliance", 
            ref: "BS EN 62305-3, Section 5.4.1",
            req: "Install compliant earth termination system as per Type A or Type B configuration requirements"
        },
        { 
            failure: "Missing or inadequate surge protection devices", 
            ref: "BS EN 62305-4, Section 6",
            req: "Install a minimum Type-1 SPD at main distribution boards as required"
        },
        { 
            failure: "SPD coordination issues between protection levels", 
            ref: "BS EN 62305-4, Section 7.3",
            req: "Replace or reconfigure SPDs to ensure proper coordination between Type 1, 2, and 3 devices"
        },
        { 
            failure: "Insufficient lightning protection zones implementation", 
            ref: "BS EN 62305-4, Section 4",
            req: "Review and implement proper LPZ boundaries with appropriate shielding measures"
        },
        { 
            failure: "Risk assessment not conducted or outdated", 
            ref: "BS EN 62305-2, Section 4",
            req: "Conduct comprehensive risk assessment in accordance with current standard requirements"
        },
        { 
            failure: "Missing bonds to external metalwork", 
            ref: "BS EN 62305-3, Section 6.2.1",
            req: "Install equipotential bonding to all external metallic installations and services"
        },
        { 
            failure: "Corrosion exceeding acceptable limits", 
            ref: "BS EN 62305-3, Section 5.5.4",
            req: "Replace corroded components and apply appropriate corrosion protection measures"
        },
        { 
            failure: "Mechanical damage to system components", 
            ref: "BS EN 62305-3, Section 5.5.3",
            req: "Repair or replace damaged components and install appropriate mechanical protection"
        },
        { 
            failure: "Installation not meeting Class I/II/III/IV requirements", 
            ref: "BS EN 62305-3, Section 5.1, Table 1",
            req: "Upgrade installation to meet the required protection class specifications"
        },
        { 
            failure: "Missing test clamps or inspection facilities", 
            ref: "BS EN 62305-3, Section 7.1",
            req: "Install test clamps and inspection joints at all required measurement points"
        },
        { 
            failure: "Documentation incomplete or missing", 
            ref: "BS EN 62305-3, Section 8",
            req: "Provide complete as-built drawings, test certificates, and maintenance documentation"
        },
        { 
            failure: "Non-compliance with manufacturer specifications", 
            ref: "BS EN 62305-3, Section 5.5.1",
            req: "Install components strictly according to manufacturer's installation instructions"
        },
        { 
            failure: "Environmental protection inadequate", 
            ref: "BS EN 62305-3, Section 5.5.3",
            req: "Install appropriate weatherproofing and environmental protection for all exposed components"
        }
    ],
    "BS 6651": [
        { 
            failure: "Earth electrode resistance above 10ohms", 
            ref: "BS 6651, Section 13.2",
            req: "Additional earth electrodes must be installed to achieve resistance below 10ohms"
        },
        { 
            failure: "Continuity failure in conductor network", 
            ref: "BS 6651, Section 9.1",
            req: "Clean and tighten all connections, replace defective joints to achieve continuity"
        },
        { 
            failure: "Air terminal spacing exceeds 20m/25m limits", 
            ref: "BS 6651, Section 7.2",
            req: "Install additional air terminals to maintain maximum 20m spacing (25m for special cases)"
        },
        { 
            failure: "Down conductor route not direct to earth", 
            ref: "BS 6651, Section 8.1",
            req: "Re-route down conductors to follow the shortest practical path to earth electrode"
        },
        { 
            failure: "Missing side-flash protection bonds", 
            ref: "BS 6651, Section 14.1",
            req: "Install equipotential bonding within 2m of down conductors to prevent side-flash"
        },
        { 
            failure: "Conductor cross-sectional area insufficient", 
            ref: "BS 6651, Section 6.2, Table 1",
            req: "Replace conductors with minimum required cross-sectional area as per material specifications"
        },
        { 
            failure: "Earth electrode depth/installation inadequate", 
            ref: "BS 6651, Section 13.1",
            req: "Install earth electrodes to minimum depth requirements with proper backfill material"
        },
        { 
            failure: "Joint resistance exceeding 0.05 Ohm", 
            ref: "BS 6651, Section 9.2",
            req: "Clean, remake, or replace joints to achieve resistance below 0.05 ohm limit"
        },
        { 
            failure: "Missing surge diverter protection", 
            ref: "BS 6651, Annex C",
            req: "Install surge diverters on incoming services as recommended in the annex"
        },
        { 
            failure: "Corrosion affecting system integrity", 
            ref: "BS 6651, Section 6.3",
            req: "Replace corroded components and apply bi-metallic protection where required"
        },
        { 
            failure: "Mechanical protection inadequate", 
            ref: "BS 6651, Section 6.4",
            req: "Install mechanical protection up to 3m height or as required for location"
        },
        { 
            failure: "Test facilities not provided", 
            ref: "BS 6651, Section 33.1",
            req: "Install test clamps or disconnection facilities for periodic testing"
        },
        { 
            failure: "Risk factor calculation not meeting 10^-5 limit", 
            ref: "BS 6651, Section 4.1",
            req: "Improve protection measures to achieve acceptable risk factor below 10^-5"
        },
        { 
            failure: "Material specifications non-compliant", 
            ref: "BS 6651, Section 6.1, Table 1",
            req: "Replace materials with compliant copper, aluminum, or steel as specified"
        },
        { 
            failure: "Missing bonds to metallic services", 
            ref: "BS 6651, Section 14.2",
            req: "Install equipotential bonding to all metallic water, gas, and electrical services"
        },
        { 
            failure: "Down conductor count insufficient for building size", 
            ref: "BS 6651, Section 8.2",
            req: "Install additional down conductors to meet minimum requirements per building perimeter"
        },
        { 
            failure: "Air terminal height inadequate for protection", 
            ref: "BS 6651, Section 7.1",
            req: "Extend air terminals to provide adequate protection zone coverage"
        },
        { 
            failure: "Missing isolation joints where required", 
            ref: "BS 6651, Section 14.3",
            req: "Install isolation joints in metallic services as required to prevent system bypassing"
        },
        { 
            failure: "Installation records incomplete", 
            ref: "BS 6651, Section 34.1",
            req: "Provide complete installation records, test results, and as-built drawings"
        },
        { 
            failure: "Maintenance schedule not followed", 
            ref: "BS 6651, Section 34.2",
            req: "Implement regular maintenance program with documented inspection records"
        }
    ],
    "CP 326": [
        { 
            failure: "Non-compliance with basic protection principles", 
            ref: "CP 326, Section 2",
            req: "Review and upgrade system to meet fundamental protection principles"
        },
        { 
            failure: "Inadequate conductor sizing for historic requirements", 
            ref: "CP 326, Section 3.1",
            req: "Upgrade conductors to meet modern equivalent standards or maintain historic compliance"
        },
        { 
            failure: "Missing earth connections", 
            ref: "CP 326, Section 4",
            req: "Install proper earth connections to all system components"
        },
        { 
            failure: "Poor workmanship in installations", 
            ref: "CP 326, Section 5",
            req: "Remake installations to proper workmanship standards with appropriate fixings"
        },
        { 
            failure: "Material degradation beyond acceptable limits", 
            ref: "CP 326, Section 3.2",
            req: "Replace degraded materials with modern equivalent compliant components"
        },
        { 
            failure: "Insufficient protection coverage", 
            ref: "CP 326, Section 2.1",
            req: "Extend protection system to provide adequate coverage of structure"
        },
        { 
            failure: "Missing documentation from original installation", 
            ref: "CP 326, Section 6",
            req: "Create retrospective documentation based on site survey and testing"
        },
        { 
            failure: "Non-standard component usage", 
            ref: "CP 326, Section 3.3",
            req: "Replace non-standard components with appropriate materials meeting requirements"
        },
        { 
            failure: "Inadequate maintenance records", 
            ref: "CP 326, Section 6.1",
            req: "Establish proper maintenance documentation and inspection regime"
        },
        { 
            failure: "System modifications without proper design review", 
            ref: "CP 326, Section 5.1",
            req: "Review modifications and ensure compliance with original design principles"
        }
    ],
    "NF C 17-102": [
        { 
            failure: "ESE efficiency (DT) not verified or inadequate", 
            ref: "NF C 17-102, Section 5.2.2",
            req: "Verify ESE timing meets minimum ΔT requirements through certified testing"
        },
        { 
            failure: "Protection radius calculation errors", 
            ref: "NF C 17-102, Section 5.2.3, Equation 1",
            req: "Recalculate protection radius using correct ESE methodology and install additional terminals if required"
        },
        { 
            failure: "Air terminal not meeting ESE testing requirements", 
            ref: "NF C 17-102, Section 6.1",
            req: "Replace with certified ESE air terminal meeting French standard testing requirements"
        },
        { 
            failure: "Down conductor installation non-compliant", 
            ref: "NF C 17-102, Section 5.3",
            req: "Install down conductors according to ESE system requirements with proper routing"
        },
        { 
            failure: "Earth resistance exceeding French standard limits", 
            ref: "NF C 17-102, Section 5.4",
            req: "Improve earth termination system to meet French resistance requirements"
        },
        { 
            failure: "ESE device not certified to NF C 17-102", 
            ref: "NF C 17-102, Section 4.1",
            req: "Replace with ESE device holding valid certification to French standard"
        },
        { 
            failure: "Missing surge protection coordination", 
            ref: "NF C 17-102, Section 5.5",
            req: "Install coordinated surge protection system appropriate for ESE installation"
        },
        { 
            failure: "Equipotential bonding inadequate", 
            ref: "NF C 17-102, Section 5.4.2",
            req: "Install comprehensive equipotential bonding system as per French requirements"
        },
        { 
            failure: "Installation height calculations incorrect", 
            ref: "NF C 17-102, Section 5.2.3",
            req: "Recalculate installation height using proper ESE protection volume methodology"
        },
        { 
            failure: "Early streamer emission timing not verified", 
            ref: "NF C 17-102, Section 6.2.1",
            req: "Verify ESE timing through approved testing laboratory certification"
        },
        { 
            failure: "Protection level selection inappropriate", 
            ref: "NF C 17-102, Section 5.2.1",
            req: "Review and select appropriate protection level based on risk assessment"
        },
        { 
            failure: "Missing risk assessment per French requirements", 
            ref: "NF C 17-102, Section 5.1",
            req: "Conduct risk assessment according to French methodology and requirements"
        },
        { 
            failure: "EMC compliance issues with electronic ESE devices", 
            ref: "NF C 17-102, Section 6.4",
            req: "Ensure ESE devices meet electromagnetic compatibility requirements"
        },
        { 
            failure: "Mechanical strength testing not verified", 
            ref: "NF C 17-102, Section 6.3",
            req: "Verify mechanical strength through certified testing for wind load compliance"
        },
        { 
            failure: "Current withstand capability not proven", 
            ref: "NF C 17-102, Section 6.2.2",
            req: "Verify current withstand capability through appropriate testing certification"
        },
        { 
            failure: "Protection zone overlap insufficient", 
            ref: "NF C 17-102, Section 5.2.4",
            req: "Adjust ESE terminal positions to ensure adequate protection zone overlap"
        },
        { 
            failure: "Installation not meeting manufacturer requirements", 
            ref: "NF C 17-102, Section 7",
            req: "Install system strictly according to ESE manufacturer's certified instructions"
        },
        { 
            failure: "Missing periodic testing verification", 
            ref: "NF C 17-102, Section 8",
            req: "Implement periodic testing program for ESE device functionality verification"
        },
        { 
            failure: "Documentation not in French standard format", 
            ref: "NF C 17-102, Section 9",
            req: "Provide documentation in compliance with French standard format requirements"
        },
        { 
            failure: "System commissioning incomplete", 
            ref: "NF C 17-102, Section 7.1",
            req: "Complete full system commissioning including ESE device functional testing"
        }
    ]

};


