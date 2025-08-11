import Cirurgia from "../model/cirurgia.js";
import pacienteService from "../../paciente/service/paciente.js";
import bucket from "../../jobs/bucket.js";

const cirurgiaService = {
    createCirurgia: async (data) => {
        const {uploadedUrls, errors} = await cirurgiaService.insertPictures(data.pics)
        if(errors.length > 0) return errors
        const [day, month, year] = data.data.split('/');
        data.data = `${year}-${month}-${day}`;
        return await Cirurgia.create({
            descrição: data.descrição,
            data: data.data,
            fotos: uploadedUrls,
            paciente: data.paciente
        })        
    },
    fetchPacienteCirurgias: async (pacienteId) => {
        return await Cirurgia.findOne({
            where: {
                paciente: pacienteId
            }
        })
    },
    deleteCirurgia: async (cirurgiaId) => {
        return await Cirurgia.destroy({
            where:{
                id: cirurgiaId
            }
        })
    },  
    insertPictures: async (pictures) => {
        const results = await Promise.all(pictures.map(async (picture) => {
            try {
                const uploadedUrl = await bucket.bucketImageUpload(picture);
                return { uploadedUrl, error: null };
            } catch (err) {
                return { uploadedUrl: null, error: picture };
            }
        }));
        const uploadedUrls = results.filter(r => r.uploadedUrl).map(r => r.uploadedUrl);
        const errors = results.filter(r => r.error).map(r => r.error);
        return { uploadedUrls, errors };
    },

}

export default cirurgiaService