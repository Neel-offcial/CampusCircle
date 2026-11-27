const studentData = {

    student: {
        name: "Neel Kumar Gupta",
        semester: "V",
        section: "C",
        department: "Computer Science and Engineering"
    },

    attendance: {

        theory: [
            {
                name: "Artificial Intelligence Concepts and Practice",
                code: "BAINB501",
                conducted: 12,
                present: 8,
                absent: 4,
                percentage: 67
            },

            {
                name: "Computer Networks and Security",
                code: "BCNSB502",
                conducted: 15,
                present: 11,
                absent: 4,
                percentage: 74
            },

            {
                name: "Intelligent Data Analytics",
                code: "BIDAB503",
                conducted: 8,
                present: 7,
                absent: 1,
                percentage: 88
            },

            {
                name: "Software Testing and Quality Assurance",
                code: "BSTQAB515",
                conducted: 6,
                present: 5,
                absent: 1,
                percentage: 84
            },

            {
                name: "Research Methodology and IPR",
                code: "BRMIK504",
                conducted: 0,
                present: 0,
                absent: 0,
                percentage: null
            }
        ],

        laboratory: [
            {
                name: "Intelligent Data Analytics Lab",
                code: "BIDAB503L",
                conducted: 4,
                present: 3,
                absent: 1,
                percentage: 75
            },

            {
                name: "Artificial Intelligence Concepts and Practice",
                code: "BAICB501L",
                conducted: 4,
                present: 1,
                absent: 3,
                percentage: 25
            },

            {
                name: "Computer Networks and Security Lab",
                code: "BCNSB502L",
                conducted: 2,
                present: 2,
                absent: 0,
                percentage: 100
            },

            {
                name: "React Lab",
                code: "BRALB507",
                conducted: 4,
                present: 4,
                absent: 0,
                percentage: 100
            }
        ],

        electives: [
            {
                name: "Economics and Financial Management",
                code: "BEFMK506",
                conducted: 7,
                present: 5,
                absent: 2,
                percentage: 72
            }
        ]

    },

    faculty: {

        "BAICB501": {
            names: [
                "Prof. Preetha M",
                "Ms. Chandana B"
            ],
            initials: [
                "PM",
                "CB"
            ]
        },

        "BCNSB502": {
            names: [
                "Ms. Shamni L"
            ],
            initials: [
                "SL"
            ]
        },

        "BIDAB503": {
            names: [
                "Dr. Devi Kannan",
                "Dr. Dileep Kumar"
            ],
            initials: [
                "DK"
            ]
        },

        "BRMIK504": {
            names: [
                "Ms. Tanzem M"
            ],
            initials: [
                "TM"
            ]
        },

        "BSTQAB515": {
            names: [
                "Prof. Pallavi U"
            ],
            initials: [
                "PU"
            ]
        },

        "BEFMK506": {
            names: [
                "Ms. P R Madhushree"
            ],
            initials: [
                "PRM"
            ]
        },

        "BRALB507": {
            names: [
                "Prof. Prathyusha R"
            ],
            initials: [
                "RP"
            ]
        }
    }

};


if (typeof window !== "undefined") {
    window.studentData = studentData;
}