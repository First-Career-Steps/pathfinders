import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (using standard fonts for ATS compatibility)
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'Helvetica' },
        { src: 'Helvetica-Bold', fontWeight: 'bold' },
    ],
});

// ATS-friendly styles
const styles = StyleSheet.create({
    page: {
        size: 'A4',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.4,
    },
    // Header
    header: {
        marginBottom: 0,
        borderBottom: '1.5pt solid #000',
        paddingBottom: 10,
        textAlign: 'center',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headline: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    contactInfo: {
        fontSize: 9,
        color: '#555',
        marginBottom: 2,
    },
    // Sections
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 0,
        paddingTop: 8,
        paddingBottom: 8,
        marginBottom: 10,
        borderBottom: '1pt solid #000',
        letterSpacing: 0.5,
    },
    // About
    aboutText: {
        fontSize: 10,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    // Skills
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillItem: {
        fontSize: 9,
        padding: '3pt 8pt',
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        marginRight: 4,
        marginBottom: 4,
    },
    // Experience
    experienceItem: {
        marginBottom: 10,
    },
    experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    experienceTitle: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    experienceOrg: {
        fontSize: 10,
        fontStyle: 'italic',
        marginBottom: 3,
    },
    bullet: {
        fontSize: 9,
        marginLeft: 15,
        marginBottom: 2,
    },
    bulletPoint: {
        marginRight: 5,
    },
    // Education
    educationItem: {
        marginBottom: 6,
    },
    educationSchool: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    educationYear: {
        fontSize: 9,
        color: '#555',
    },
});

interface ResumeData {
    fullName: string;
    email: string;
    linkedinLink?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Array<{
        type: string;
        title: string;
        organization: string;
        bullets: string[];
        start_date?: string;
        end_date?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuer?: string;
        date_issued?: string;
    }>;
    phone?: string;
    location?: string;
}

const formatFullNameForPDF = (fullName?: string) => {
    const normalized = (fullName || 'Your Name').trim().replace(/\s+/g, ' ');
    // React-PDF can visually collapse normal whitespace when letter spacing is applied.
    // Non-breaking spaces keep first/middle/last names visibly separated in the PDF.
    return normalized.replace(/ /g, '\u00A0');
};

export const ProfessionalResumePDF = ({ data }: { data: ResumeData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.name}>{formatFullNameForPDF(data.fullName)}</Text>
                {data.headline && <Text style={styles.headline}>{data.headline}</Text>}
                <Text style={styles.contactInfo}>
                    {[
                        data.location,
                        data.email,
                        data.phone,
                        data.linkedinLink
                    ].filter(Boolean).join(' | ')}
                </Text>
            </View>

            {/* Professional Summary */}
            {data.aboutText && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Summary</Text>
                    <Text style={styles.aboutText}>{data.aboutText}</Text>
                </View>
            )}

            {/* Experience */}
            {data.experiences && data.experiences.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    {data.experiences.map((exp, index) => (
                        <View key={index} style={styles.experienceItem}>
                            <View style={styles.experienceHeader}>
                                <Text style={styles.experienceTitle}>{exp.title}</Text>
                                {exp.start_date && (
                                    <Text style={styles.educationYear}>
                                        {exp.start_date} - {exp.end_date || 'Present'}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.experienceOrg}>
                                {exp.organization} • {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                            </Text>
                            {exp.bullets && exp.bullets.length > 0 && (
                                <View>
                                    {exp.bullets.map((bullet, bulletIndex) => (
                                        <View key={bulletIndex} style={{ flexDirection: 'row' }}>
                                            <Text style={styles.bulletPoint}>•</Text>
                                            <Text style={styles.bullet}>{bullet.replace(/^[•\-\*\s]+/, '')}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Education */}
            {data.highSchool && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    <View style={styles.educationItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.educationSchool}>{data.highSchool}</Text>
                            {data.graduationYear && (
                                <Text style={styles.educationYear}>
                                    Graduated: {data.graduationYear}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Certifications</Text>
                    {data.certifications.map((cert, index) => (
                        <View key={index} style={{ marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{cert.name}</Text>
                                {cert.date_issued && (
                                    <Text style={styles.educationYear}>{cert.date_issued}</Text>
                                )}
                            </View>
                            {cert.issuer && (
                                <Text style={{ fontSize: 9, color: '#555' }}>{cert.issuer}</Text>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                        {data.skills.map((skill, index) => (
                            <Text key={index} style={styles.skillItem}>
                                {skill}
                            </Text>
                        ))}
                    </View>
                </View>
            )}
        </Page>
    </Document>
);
