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
            pacienteId: data.pacienteId 
        })        
    },
    fetchPacienteCirurgias: async (pacienteId) => {
        return await Cirurgia.findAll({
            where: {
                pacienteId: pacienteId 
            },
            order: [['data', 'DESC']]
        })
    },
    deleteCirurgia: async (cirurgia) => {
        const isDeleted = await cirurgiaService.deletePictures(cirurgia.pics)
        if(!isDeleted) return null
        let destroyed = await Cirurgia.destroy({
            where: {
                id: cirurgia.id
            }
        })
        return destroyed
    },  
    fetchCirurgia: async (cirurgiaId) => {
        return await Cirurgia.findOne({
            where: {
                id: cirurgiaId
            }
        })
    },
    updateCirurgia: async (data) => {
        const urls = data.url || data.urls
        const isDeleted = await cirurgiaService.deletePictures(urls)
        if(!isDeleted) return null

        const {uploadedUrls, errors} = await cirurgiaService.insertPictures(data.pics)
        if(errors.length > 0) return errors

        const beforeUpdate = await cirurgiaService.fetchCirurgia(data.id)
        beforeUpdate.fotos = beforeUpdate.fotos.filter(
                                foto => !uploadedUrls.includes(foto)
                                );
        const totalUrls = [
            ...uploadedUrls,
            ...beforeUpdate.fotos.filter(foto => !urls.includes(foto))
            ]

        if(data.descricao === undefined) data.descricao = beforeUpdate.descrição
        if(data.data) data.data = pacienteService.formatDate(data.data)

        return await Cirurgia.update({
            descrição: data.descricao,
            data: data.data,
            fotos: totalUrls,
            paciente: data.paciente
        },
        {
            where: {
                id: data.id
            }
        })
    },
    deletePictures: async (pictures) => {
        if(!pictures) return true
        if(!Array.isArray(pictures)) pictures = [pictures]
        for(const picture of pictures){
            const isDeleted = await bucket.s3Delete(picture)
            if(!isDeleted) return null
        }
        return true
    },
    insertPictures: async (pictures) => {
        if(!Array.isArray(pictures)) pictures = [pictures]

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
    fetchAllCirurgias: async (userId) => {
        const pacientes = await pacienteService.fetchUsersPacientes(userId)
        return await Cirurgia.findAll({
            where: {
                pacienteId: pacientes.map(paciente => paciente.id)
            }
        })
    }

}

export default cirurgiaService